import expand, { extract } from 'emmet';
import { StateField, StateEffect, Prec } from '@codemirror/state';
import { EditorView, keymap, showTooltip } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';

function tryExpand(lineText, type) {
  try {
    const extracted = extract(lineText, lineText.length, { type });
    if (!extracted?.abbreviation) return null;
    const expanded = expand(extracted.abbreviation, {
      type, syntax: type === 'markup' ? 'html' : 'css',
      options: { 'output.indent': '  ', 'output.baseIndent': '' },
    });
    return expanded ? { extracted, expanded } : null;
  } catch { return null; }
}

const emmetTooltipEffect = StateEffect.define();
let emmetTimer;

export function makeEmmetExtensions(type, enabledRef) {
  const field = StateField.define({
    create: () => null,
    update(tooltip, tr) {
      for (const e of tr.effects) if (e.is(emmetTooltipEffect)) return e.value;
      if (tr.docChanged || tr.selectionSet) return null;
      return tooltip;
    },
    provide: f => showTooltip.from(f),
  });

  const listener = EditorView.updateListener.of(update => {
    if (!update.docChanged && !update.selectionSet) return;
    clearTimeout(emmetTimer);
    if (!enabledRef.current) return;
    emmetTimer = setTimeout(() => {
      const { from } = update.view.state.selection.main;
      const line = update.view.state.doc.lineAt(from);
      const lineText = line.text.substring(0, from - line.from);
      const result = tryExpand(lineText, type);
      if (!result) return;
      const clean = result.expanded.replace(/\$\{\d+(?::[^}]*)?\}/g, '');
      update.view.dispatch({ effects: emmetTooltipEffect.of({
        pos: from, above: false, strictSide: true,
        create() {
          const wrapper = document.createElement('div');
          wrapper.className = 'cm-emmet-preview';
          const label = document.createElement('span');
          label.className = 'cm-emmet-preview-label';
          label.textContent = 'Tab to expand';
          wrapper.appendChild(label);
          const editorEl = document.createElement('div');
          wrapper.appendChild(editorEl);
          const previewView = new EditorView({
            state: EditorState.create({
              doc: clean,
              extensions: [
                oneDark,
                type === 'markup' ? html() : css(),
                EditorState.readOnly.of(true),
                EditorView.editable.of(false),
                EditorView.theme({
                  '&': { background: 'transparent' },
                  '.cm-gutters': { display: 'none' },
                  '.cm-cursor': { display: 'none' },
                  '.cm-scroller': { fontFamily: "'Cascadia Code','Fira Code',Consolas,monospace", fontSize: '12px', maxHeight: '180px', overflow: 'auto' },
                  '.cm-content': { padding: '2px 0' },
                }),
              ],
            }),
            parent: editorEl,
          });
          return { dom: wrapper, destroy() { previewView.destroy(); } };
        },
      }) });
    }, 600);
  });

  const km = Prec.highest(keymap.of([{
    key: 'Tab',
    run: (view) => {
      if (!enabledRef.current) return false;
      const { from } = view.state.selection.main;
      const line = view.state.doc.lineAt(from);
      const lineText = line.text.substring(0, from - line.from);
      const result = tryExpand(lineText, type);
      if (!result) return false;
      const { extracted, expanded } = result;
      const baseIndent = line.text.match(/^(\s*)/)[1];
      const indented = expanded.replace(/^/gm, (_, o) => o === 0 ? '' : baseIndent);
      const clean = indented.replace(/\$\{\d+(?::[^}]*)?\}/g, '');
      const abbrFrom = line.from + extracted.start;
      const cursorPos = abbrFrom + (indented.indexOf('${') !== -1 ? indented.indexOf('${') : clean.length);
      view.dispatch({ changes: { from: abbrFrom, to: from, insert: clean }, selection: { anchor: cursorPos } });
      return true;
    },
  }]));

  return [field, listener, km];
}

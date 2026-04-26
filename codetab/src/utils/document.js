export const CONSOLE_INTERCEPTOR = `<script>
(function() {
  ['log','info','warn','error'].forEach(m => {
    const orig = console[m];
    console[m] = function(...args) {
      orig.apply(console, args);
      window.parent.postMessage({ source:'codetab-console', type:m,
        args: args.map(a => { try { return typeof a === 'object' ? JSON.stringify(a,null,2) : String(a); } catch { return '[Object]'; } })
      }, '*');
    };
  });
  window.addEventListener('error', e =>
    window.parent.postMessage({ source:'codetab-console', type:'error', args:[e.message + ' (line ' + e.lineno + ')'] }, '*')
  );
})();
<\/script>`;

export function buildDocument(h, c, j, resources = { css: [], js: [] }, htmlMeta = {}) {
  const cssLinks  = (resources.css || []).map(u => `<link rel="stylesheet" href="${u}">`).join('\n');
  const jsScripts = (resources.js  || []).map(u => `<script src="${u}"><\/script>`).join('\n');
  const htmlClass = htmlMeta.classes     ? ` class="${htmlMeta.classes}"` : '';
  const bodyClass = htmlMeta.bodyClasses ? ` class="${htmlMeta.bodyClasses}"` : '';
  const headExtra = htmlMeta.head        ? `\n${htmlMeta.head}` : '';
  return `<!DOCTYPE html><html${htmlClass}><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${headExtra}\n${cssLinks}\n<style>${c}</style></head><body${bodyClass}>\n${CONSOLE_INTERCEPTOR}\n${h}\n${jsScripts}\n<script>${j}<\/script></body></html>`;
}

import { oneDark }                          from '@codemirror/theme-one-dark';
import { dracula }                           from '@uiw/codemirror-theme-dracula';
import { tokyoNight }                        from '@uiw/codemirror-theme-tokyo-night';
import { nord }                              from '@uiw/codemirror-theme-nord';
import { monokai }                           from '@uiw/codemirror-theme-monokai';
import { materialDark, materialLight }       from '@uiw/codemirror-theme-material';
import { githubDark, githubLight }           from '@uiw/codemirror-theme-github';
import { solarizedDark, solarizedLight }     from '@uiw/codemirror-theme-solarized';

export const THEMES = [
  { id: 'one-dark',        label: 'One Dark',        ext: oneDark        },
  { id: 'dracula',         label: 'Dracula',          ext: dracula        },
  { id: 'tokyo-night',     label: 'Tokyo Night',      ext: tokyoNight     },
  { id: 'nord',            label: 'Nord',             ext: nord           },
  { id: 'monokai',         label: 'Monokai',          ext: monokai        },
  { id: 'material-dark',   label: 'Material Dark',    ext: materialDark   },
  { id: 'material-light',  label: 'Material Light',   ext: materialLight  },
  { id: 'github-dark',     label: 'GitHub Dark',      ext: githubDark     },
  { id: 'github-light',    label: 'GitHub Light',     ext: githubLight    },
  { id: 'solarized-dark',  label: 'Solarized Dark',   ext: solarizedDark  },
  { id: 'solarized-light', label: 'Solarized Light',  ext: solarizedLight },
];

export function getThemeExt(id) {
  return THEMES.find(t => t.id === id)?.ext ?? oneDark;
}

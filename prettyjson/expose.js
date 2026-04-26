// Runs in MAIN world at document_idle — chrome.runtime is not available here.
// Reads config written to sessionStorage by content.js (isolated world).
(function () {
  const raw      = sessionStorage.getItem('__pj_raw');
  const PJ_NAME   = sessionStorage.getItem('__pj_name');
  const PJ_OBJECT = sessionStorage.getItem('__pj_object');

  if (!raw || !PJ_OBJECT) return;

  try {
    window[PJ_OBJECT] = JSON.parse(raw);
    console.log(
      `%c[${PJ_NAME}]%c data available as %c${PJ_OBJECT}`,
      'color:#4EC9B0;font-weight:bold',
      'color:inherit',
      'color:#DCDCAA;font-weight:bold'
    );
  } catch {}
})();

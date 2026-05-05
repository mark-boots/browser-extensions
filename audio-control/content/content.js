const PASSTHROUGH = ['AC_SET_GAIN', 'AC_SET_BASS', 'AC_SET_TREBLE', 'AC_SET_MONO'];

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (PASSTHROUGH.includes(msg.type)) {
    window.postMessage({ type: msg.type, value: msg.value }, '*');
    return;
  }
  if (msg.type === 'AC_GET_GAIN') {
    const handler = ({ data }) => {
      if (data?.type === 'AC_GAIN') {
        window.removeEventListener('message', handler);
        sendResponse({ value: data.value });
      }
    };
    window.addEventListener('message', handler);
    window.postMessage({ type: 'AC_GET_GAIN' }, '*');
    return true;
  }
});

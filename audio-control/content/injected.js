(function () {
  let gainValue = 1.0;
  let bassValue = 0;    // dB
  let trebleValue = 0;  // dB
  let monoEnabled = false;
  let hasUserGesture = false;
  let audioCtx = null;

  const gainNodes = [];
  const bassNodes = [];
  const trebleNodes = [];
  const monoNodes = [];
  const processed = new WeakSet();

  function getCtx() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function attach(el) {
    if (processed.has(el)) return;
    if (!hasUserGesture) return;
    processed.add(el);
    try {
      const ctx = getCtx();
      const source = ctx.createMediaElementSource(el);

      // Mono node: downmix to 1 channel when enabled, passthrough otherwise
      const mono = ctx.createGain();
      if (monoEnabled) {
        mono.channelCount = 1;
        mono.channelCountMode = 'explicit';
        mono.channelInterpretation = 'speakers';
      }

      const gain = ctx.createGain();
      gain.gain.value = gainValue;

      const bass = ctx.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = 200;
      bass.gain.value = bassValue;

      const treble = ctx.createBiquadFilter();
      treble.type = 'highshelf';
      treble.frequency.value = 8000;
      treble.gain.value = trebleValue;

      source.connect(mono);
      mono.connect(gain);
      gain.connect(bass);
      bass.connect(treble);
      treble.connect(ctx.destination);

      gainNodes.push(gain);
      bassNodes.push(bass);
      trebleNodes.push(treble);
      monoNodes.push(mono);
    } catch (_) {}
  }

  function scanAll() {
    if (gainValue === 1.0 && bassValue === 0 && trebleValue === 0 && !monoEnabled) return;
    document.querySelectorAll('video, audio').forEach(attach);
  }

  new MutationObserver(scanAll).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  function onFirstGesture() {
    hasUserGesture = true;
    scanAll();
  }
  document.addEventListener('click', onFirstGesture, { once: true, capture: true });
  document.addEventListener('keydown', onFirstGesture, { once: true, capture: true });

  window.addEventListener('message', ({ source, data }) => {
    if (source !== window || !data) return;

    if (data.type === 'AC_SET_GAIN') {
      gainValue = data.value;
      gainNodes.forEach(n => (n.gain.value = gainValue));
      if (audioCtx) scanAll();
    }
    if (data.type === 'AC_SET_BASS') {
      bassValue = data.value;
      bassNodes.forEach(n => (n.gain.value = bassValue));
      if (audioCtx) scanAll();
    }
    if (data.type === 'AC_SET_TREBLE') {
      trebleValue = data.value;
      trebleNodes.forEach(n => (n.gain.value = trebleValue));
      if (audioCtx) scanAll();
    }
    if (data.type === 'AC_SET_MONO') {
      monoEnabled = data.value;
      monoNodes.forEach(n => {
        if (monoEnabled) {
          n.channelCount = 1;
          n.channelCountMode = 'explicit';
          n.channelInterpretation = 'speakers';
        } else {
          n.channelCount = 2;
          n.channelCountMode = 'max';
        }
      });
      if (audioCtx) scanAll();
    }
    if (data.type === 'AC_GET_GAIN') {
      window.postMessage({ type: 'AC_GAIN', value: gainValue }, '*');
    }
  });
})();

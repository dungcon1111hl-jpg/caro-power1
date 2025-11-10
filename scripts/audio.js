// Audio System
window.useAudio = function() {
  const { useRef, useEffect } = React;
  const ctxRef = useRef(null);
  const enabledRef = useRef(true);

  useEffect(() => () => {
    try {
      ctxRef.current?.close?.();
    } catch {}
  }, []);

  const ensure = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  };

  const beep = (f = 660, d = 0.06) => {
    if (!enabledRef.current) return;
    const c = ensure();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'square';
    o.frequency.value = f;
    g.gain.value = 0.02;
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + d);
  };

  return {
    setEnabled: (b) => enabledRef.current = b,
    beep,
    tick: () => beep(880, 0.03),
    hurry: () => beep(1200, 0.08),
    warning: () => beep(800, 0.1),
    timeout: () => beep(220, 0.25),
    win: () => {
      beep(523, 0.08);
      setTimeout(() => beep(659, 0.08), 100);
      setTimeout(() => beep(783, 0.12), 220);
    }
  };
};
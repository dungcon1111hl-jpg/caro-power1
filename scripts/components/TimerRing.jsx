// Timer Ring Component
window.TimerRing = function({ seconds, running, token, onTimeout, compact = false, audio }) {
  const { useState, useEffect, useRef } = React;
  
  const R = 26;
  const C = 2 * Math.PI * R;
  const [left, setLeft] = useState(seconds);
  const raf = useRef();
  const start = useRef();
  const hurryPlayed = useRef(false);

  useEffect(() => {
    setLeft(seconds);
    hurryPlayed.current = false;
  }, [seconds, token]);

  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(raf.current);
      return;
    }
    
    start.current = performance.now();
    const startLeft = left;

    const loop = (t) => {
      const dt = (t - start.current) / 1000;
      const nl = Math.max(0, startLeft - dt);

      if (nl > 0 && nl <= 4.0 && !hurryPlayed.current) {
        audio?.hurry?.();
        hurryPlayed.current = true;
      }

      setLeft(nl);
      if (nl <= 0) {
        onTimeout?.();
        return;
      }
      raf.current = requestAnimationFrame(loop);
    };
    
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [running, token, audio]);

  const pct = Math.max(0, Math.min(1, left / seconds));
  const dash = C * pct;
  const sizeClass = compact ? 'w-10 h-10' : 'w-14 h-14';
  
  return (
    <svg viewBox="0 0 64 64" className={`${sizeClass} -rotate-90`}>
      <circle cx="32" cy="32" r={R} stroke="#e5e7eb" strokeWidth="6" fill="none" />
      <circle 
        cx="32" 
        cy="32" 
        r={R} 
        stroke="#22c55e" 
        strokeWidth="6" 
        fill="none" 
        strokeDasharray={`${dash} ${C}`} 
        strokeLinecap="round" 
      />
    </svg>
  );
};
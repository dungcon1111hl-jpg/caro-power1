// Timer Ring Component with Pause/Resume Support and Visual Warning Effects
window.TimerRing = function({ seconds, running, paused, token, onTimeout, compact = false, audio, warningSeconds = 60 }) {
  const { useState, useEffect, useRef } = React;
  
  const R = 26;
  const C = 2 * Math.PI * R;
  const [left, setLeft] = useState(seconds);
  const [isWarning, setIsWarning] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const raf = useRef();
  const start = useRef();
  const pausedTime = useRef(0);
  const hurryPlayed = useRef(false);
  const warningPlayed = useRef(false);

  // Reset timer when seconds or token changes
  useEffect(() => {
    setLeft(seconds);
    pausedTime.current = 0;
    hurryPlayed.current = false;
    warningPlayed.current = false;
  }, [seconds, token]);

  // Handle pause/resume
  useEffect(() => {
    if (paused) {
      // Pause: save current time
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
      pausedTime.current = left;
    } else if (running && !paused) {
      // Resume: continue from paused time
      if (pausedTime.current > 0) {
        setLeft(pausedTime.current);
        pausedTime.current = 0;
      }
    }
  }, [paused, running, left]);

  // Main timer loop
  useEffect(() => {
    if (!running || paused) {
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
      return undefined;
    }
    
    start.current = performance.now();
    const startLeft = left;

    const loop = (t) => {
      const dt = (t - start.current) / 1000;
      const nl = Math.max(0, startLeft - dt);

      // Warning visual and sound when approaching timeout
      if (warningSeconds > 0 && nl <= warningSeconds && nl > 0) {
        setIsWarning(true);
        if (!warningPlayed.current) {
          audio?.warning?.();
          warningPlayed.current = true;
        }
      } else {
        setIsWarning(false);
      }

      // Urgent visual and sound when very close to timeout
      if (nl > 0 && nl <= 4.0) {
        setIsUrgent(true);
        if (!hurryPlayed.current) {
          audio?.hurry?.();
          hurryPlayed.current = true;
        }
      } else {
        setIsUrgent(false);
      }

      setLeft(nl);
      if (nl <= 0) {
        onTimeout?.();
        raf.current = null;
        return;
      }
      raf.current = requestAnimationFrame(loop);
    };
    
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };
  }, [running, paused, token, audio, warningSeconds, left, onTimeout]);

  const pct = Math.max(0, Math.min(1, left / seconds));
  const dash = C * pct;
  const sizeClass = compact ? 'w-10 h-10' : 'w-14 h-14';
  
  // Color based on time remaining
  let strokeColor = '#22c55e'; // green
  if (left <= warningSeconds && left > 4) {
    strokeColor = '#f59e0b'; // amber
  } else if (left <= 4) {
    strokeColor = '#ef4444'; // red
  }
  
  // Animation classes for warning effects
  const warningClass = isWarning ? 'animate-pulse' : '';
  const urgentClass = isUrgent ? 'animate-ping' : '';
  const glowClass = isUrgent ? 'drop-shadow-[0_0_8px_currentColor]' : isWarning ? 'drop-shadow-[0_0_4px_currentColor]' : '';
  
  return (
    <div className={`relative ${isUrgent ? urgentClass : ''}`}>
      <svg viewBox="0 0 64 64" className={`${sizeClass} -rotate-90 ${warningClass}`}>
        <circle cx="32" cy="32" r={R} stroke="#e5e7eb" strokeWidth="6" fill="none" />
        <circle 
          cx="32" 
          cy="32" 
          r={R} 
          stroke={strokeColor} 
          strokeWidth="6" 
          fill="none" 
          strokeDasharray={`${dash} ${C}`} 
          strokeLinecap="round"
          className={`${paused ? 'opacity-50' : ''} ${glowClass} transition-all duration-300`}
          style={{
            filter: isUrgent ? 'drop-shadow(0 0 8px currentColor)' : isWarning ? 'drop-shadow(0 0 4px currentColor)' : 'none',
            animation: isUrgent ? 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' : isWarning ? 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
          }}
        />
      </svg>
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xs text-slate-400 font-bold">⏸</div>
        </div>
      )}
      {/* Warning overlay */}
      {isUrgent && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-full rounded-full bg-red-500/20 animate-ping"></div>
        </div>
      )}
    </div>
  );
};


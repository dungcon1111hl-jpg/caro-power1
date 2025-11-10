// Timer Canvas Component - HTML5 Canvas với requestAnimationFrame
window.TimerCanvas = function({ 
  seconds, 
  running, 
  paused, 
  token, 
  onTimeout, 
  compact = false, 
  audio,
  player,
  config
}) {
  const { useState, useEffect, useRef } = React;
  
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const [left, setLeft] = useState(seconds);
  const [displayTime, setDisplayTime] = useState('00:00');
  
  // Get config from timer config manager (not hardcoded)
  const [timerConfig, setTimerConfig] = useState(() => {
    if (window.timerConfigManager) {
      return window.timerConfigManager.getConfig();
    }
    return { warningSeconds: 10 }; // Default fallback
  });
  
  useEffect(() => {
    if (window.timerConfigManager) {
      const updateConfig = () => {
        setTimerConfig(window.timerConfigManager.getConfig());
      };
      const interval = setInterval(updateConfig, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, []);
  
  const warningThreshold = timerConfig?.warningSeconds || 10; // Configurable warning threshold
  
  // Canvas dimensions
  const size = compact ? 80 : 120;
  const center = size / 2;
  const radius = compact ? 35 : 50;
  const lineWidth = compact ? 6 : 8;
  const circumference = 2 * Math.PI * radius;
  
  // Reset timer when seconds or token changes
  useEffect(() => {
    setLeft(seconds);
    pausedTimeRef.current = 0;
    startTimeRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [seconds, token]);
  
  // Handle pause/resume
  useEffect(() => {
    if (paused) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      pausedTimeRef.current = left;
    } else if (running && !paused && pausedTimeRef.current > 0) {
      // Resume from paused time
      setLeft(pausedTimeRef.current);
      pausedTimeRef.current = 0;
    }
  }, [paused, running, left]);
  
  // Format time as MM:SS
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get color based on time remaining (xanh → vàng → đỏ)
  const getColor = (timeLeft) => {
    // Red - urgent (≤ warningThreshold, configurable)
    if (timeLeft <= warningThreshold) {
      return '#ef4444';
    }
    // Amber - warning (≤ warningThreshold * 2)
    else if (timeLeft <= warningThreshold * 2) {
      return '#f59e0b';
    }
    // Green - normal
    else {
      return '#22c55e';
    }
  };
  
  // Draw timer on canvas
  const drawTimer = (ctx, timeLeft, isWarning) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Background circle
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    
    // Progress circle
    const progress = Math.max(0, Math.min(1, timeLeft / seconds));
    const offset = circumference * (1 - progress);
    const color = getColor(timeLeft);
    
    ctx.beginPath();
    ctx.arc(center, center, radius, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progress);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Warning flash effect (red overlay when ≤ warningThreshold, configurable)
    if (isWarning && timeLeft <= warningThreshold) {
      const flashAlpha = 0.3 + 0.2 * Math.sin(Date.now() / 100); // Flashing effect
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(239, 68, 68, ${flashAlpha})`;
      ctx.lineWidth = lineWidth + 2;
      ctx.stroke();
    }
    
    // Time text - hiển thị ở giữa vòng tròn (phút:giây)
    const timeText = formatTime(timeLeft);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${compact ? 14 : 18}px 'Roboto', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Shadow for better readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText(timeText, center, center);
    ctx.shadowBlur = 0; // Reset shadow
    
    // Player indicator (optional, below time)
    if (player && !compact) {
      ctx.fillStyle = config?.skins?.[player]?.primary || '#ffffff';
      ctx.font = `bold ${compact ? 10 : 12}px 'Roboto', sans-serif`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 3;
      ctx.fillText(player, center, center + (compact ? 12 : 16));
      ctx.shadowBlur = 0;
    }
  };
  
  // Main timer loop with requestAnimationFrame
  useEffect(() => {
    if (!running || paused) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return undefined;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    
    // Set canvas size
    canvas.width = size;
    canvas.height = size;
    
    // Set DPI for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    
    startTimeRef.current = performance.now();
    const startLeft = left;
    let warningPlayed = false;
    let beepInterval = null;
    
    const loop = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      
      const elapsed = (timestamp - startTimeRef.current) / 1000;
      const newLeft = Math.max(0, startLeft - elapsed);
      
      // Update display time
      setDisplayTime(formatTime(newLeft));
      setLeft(newLeft);
      
      // Warning sound when ≤ warningThreshold seconds (configurable, not hardcoded)
      if (newLeft <= warningThreshold && newLeft > 0 && !warningPlayed) {
        warningPlayed = true;
        // Play beep sound using Web Audio API
        if (audio?.warning) {
          audio.warning();
        }
        // Continuous beep every second when ≤ warningThreshold seconds
        beepInterval = setInterval(() => {
          if (newLeft > 0 && audio?.beep) {
            audio.beep(800, 0.1); // Beep sound via Web Audio API
          }
        }, 1000);
      }
      
      // Stop beeping if time is up or paused
      if (newLeft <= 0 || paused) {
        if (beepInterval) {
          clearInterval(beepInterval);
          beepInterval = null;
        }
      }
      
      // Draw timer (warning when ≤ warningThreshold, not hardcoded)
      const isWarning = newLeft <= warningThreshold;
      drawTimer(ctx, newLeft, isWarning);
      
      if (newLeft <= 0) {
        if (beepInterval) {
          clearInterval(beepInterval);
        }
        onTimeout?.();
        return;
      }
      
      rafRef.current = requestAnimationFrame(loop);
    };
    
    rafRef.current = requestAnimationFrame(loop);
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (beepInterval) {
        clearInterval(beepInterval);
      }
    };
  }, [running, paused, token, audio, left, seconds, player, config, warningThreshold, onTimeout]);
  
  // Initial draw when paused
  useEffect(() => {
    if (paused && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const canvas = canvasRef.current;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);
        drawTimer(ctx, left, left <= warningThreshold);
      }
    }
  }, [paused, left, warningThreshold]);
  
  return (
    <div className="relative inline-block">
      <canvas
        ref={canvasRef}
        className={`${compact ? 'w-20 h-20' : 'w-30 h-30'}`}
        style={{
          display: 'block',
          imageRendering: 'crisp-edges',
          imageRendering: '-webkit-optimize-contrast'
        }}
      />
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-xs text-slate-400 font-bold bg-slate-900/50 rounded-full px-2 py-1">
            ⏸
          </div>
        </div>
      )}
    </div>
  );
};


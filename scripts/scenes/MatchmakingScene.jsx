// Matchmaking Scene
window.MatchmakingScene = function({ config, onCancel, onMatched }) {
  const { useState, useEffect } = React;
  const [t, setT] = useState(0);
  
  useEffect(() => {
    const s = performance.now();
    const id = setInterval(() => setT(Math.floor((performance.now() - s) / 1000)), 200);
    let mounted = true;
    let timeoutId = null;

    (async () => {
      try {
        if (window.CaroNet) {
          if (!window.CaroNet.user && config?.username) {
            await window.CaroNet.login(config.username || window.CaroUtils.randomName());
          }
          if (window.CaroNet && !window.CaroNet.io) {
            await window.CaroNet.connect();
          }
          window.CaroNet.onMatched((payload) => {
            if (!mounted) return;
            onMatched(payload);
          });
          window.CaroNet.enqueue();
          return; // Don't fallback if connected
        }
      } catch (e) {
        console.warn('Matchmaking offline', e);
      }
      // Fallback: local match
      timeoutId = setTimeout(() => {
        if (!mounted) return;
        onMatched({ 
          name: window.CaroUtils.randomName(), 
          elo: Math.floor(1200 + Math.random() * 400), 
          avatar: window.CaroUtils.randomAvatar() 
        });
      }, 2200 + Math.random() * 1300);
    })();
    
    return () => {
      mounted = false;
      clearInterval(id);
      if (timeoutId) clearTimeout(timeoutId);
      try { window.CaroNet?.dequeue(); } catch {}
    };
  }, [config]);
  
  return (
    <div className="scene-container">
      <div className="stars"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      
      <div className="glass-card p-6 text-center w-full max-w-md shadow-2xl">
        <div className="text-2xl font-bold text-white mb-2">Looking for a match…</div>
        <div className="text-sm text-slate-400 mb-4">Time: {t}s</div>
        <div className="mx-auto w-32 h-32 rounded-full border-8 border-caro-green/40 border-t-transparent animate-spin"></div>
        <div className="mt-5">
          <button
            className="neon-button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
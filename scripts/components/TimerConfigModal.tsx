// Timer Configuration Modal Component
window.TimerConfigModal = function({ isOpen, onClose, onSave }) {
  const { useState, useEffect } = React;
  const { timerConfigManager } = window;

  const [config, setConfig] = useState({
    matchSeconds: 600, // Tổng thời gian mỗi người chơi (10 phút)
    pauseOnOpponentTurn: true,
    warningSeconds: 60
  });

  useEffect(() => {
    if (isOpen && timerConfigManager) {
      const current = timerConfigManager.getConfig();
      setConfig(current);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (timerConfigManager) {
      timerConfigManager.updateConfig(config);
      onSave?.(config);
    }
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTimeInput = (value) => {
    // Parse "MM:SS" or "M" (minutes) format
    if (value.includes(':')) {
      const [mins, secs] = value.split(':').map(Number);
      return (mins || 0) * 60 + (secs || 0);
    }
    return (Number(value) || 0) * 60;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 w-full max-w-md shadow-2xl">
        <div className="text-2xl font-bold mb-4 text-white" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>⏱️ Timer Configuration</div>
        
        <div className="space-y-4">
          {/* Match Time - Each player has their own time */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
              ⏱️ Total Time per Player
            </label>
            <div className="mb-2 text-xs text-slate-400" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
              Each player gets this total time. Timer only runs during their turn.
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={formatTime(config.matchSeconds)}
                onChange={(e) => {
                  const parsed = parseTimeInput(e.target.value);
                  if (parsed >= 0 && parsed <= 3600) {
                    setConfig({ ...config, matchSeconds: parsed });
                  }
                }}
                placeholder="10:00"
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-caro-green"
              />
              <div className="text-xs text-slate-400 w-20">
                ({Math.floor(config.matchSeconds / 60)} min)
              </div>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Quick presets:
              <button
                onClick={() => setConfig({ ...config, matchSeconds: 300 })}
                className="ml-2 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs"
              >
                5 min
              </button>
              <button
                onClick={() => setConfig({ ...config, matchSeconds: 600 })}
                className="ml-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs"
              >
                10 min
              </button>
              <button
                onClick={() => setConfig({ ...config, matchSeconds: 900 })}
                className="ml-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs"
              >
                15 min
              </button>
            </div>
          </div>

          {/* Warning Time */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              ⚠️ Warning Time (seconds before timeout)
            </label>
            <input
              type="number"
              min="0"
              max={config.matchSeconds}
              value={config.warningSeconds}
              onChange={(e) => {
                const val = Math.max(0, Math.min(config.matchSeconds, Number(e.target.value)));
                setConfig({ ...config, warningSeconds: val });
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-caro-green"
            />
            <div className="mt-1 text-xs text-slate-500" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
              Warning when {config.warningSeconds} seconds remaining
            </div>
          </div>

          {/* Pause on Opponent Turn */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-300">
              Pause Timer on Opponent Turn
            </label>
            <button
              onClick={() => setConfig({ ...config, pauseOnOpponentTurn: !config.pauseOnOpponentTurn })}
              className={`px-4 py-2 rounded-lg transition-colors ${
                config.pauseOnOpponentTurn
                  ? 'bg-caro-green text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {config.pauseOnOpponentTurn ? 'Yes' : 'No'}
            </button>
          </div>

          {/* Reset to Default */}
          <button
            onClick={() => {
              if (timerConfigManager) {
                timerConfigManager.resetToDefault();
                const defaultConfig = timerConfigManager.getConfig();
                setConfig(defaultConfig);
              }
            }}
            className="w-full px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm"
          >
            Reset to Default (10 minutes)
          </button>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-lg bg-caro-green hover:bg-green-600 text-white font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};





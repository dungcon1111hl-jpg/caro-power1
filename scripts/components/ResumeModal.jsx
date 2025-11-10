// Resume Game Modal Component
window.ResumeModal = function({ isOpen, onResume, onNewGame, saveInfo }) {
  if (!isOpen) return null;

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 backdrop-blur-md flex items-center justify-center z-50 p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars"></div>
      </div>
      
      <div className="relative z-10 glass-card p-8 w-full max-w-md shadow-2xl border border-white/10">
        {/* Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-caro-green to-cyan-400 flex items-center justify-center text-3xl animate-pulse shadow-lg shadow-caro-green/30">
            💾
          </div>
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-caro-green to-cyan-400 bg-clip-text text-transparent">
          Resume Game
        </h2>
        
        {/* Game Info */}
        {saveInfo && (
          <div className="mb-6 glass-card p-4 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Mode:</span>
              <span className="text-white font-semibold">{saveInfo.mode || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Moves:</span>
              <span className="text-white font-semibold">{saveInfo.moveCount || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Current Player:</span>
              <span className="text-caro-green font-bold text-lg">{saveInfo.current || 'X'}</span>
            </div>
            <div className="pt-2 border-t border-white/10">
              <div className="text-xs text-slate-400 text-center">
                Saved: {formatDate(saveInfo.timestamp)}
              </div>
            </div>
          </div>
        )}

        <div className="text-sm text-slate-300 mb-6 text-center" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
          You have a saved game. Do you want to resume or start a new game?
        </div>

        <div className="flex gap-3">
          <button
            onClick={onResume}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-caro-green to-cyan-400 hover:from-green-600 hover:to-cyan-500 text-white font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg shadow-caro-green/30"
          >
            ▶️ Resume
          </button>
          <button
            onClick={onNewGame}
            className="flex-1 px-6 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-slate-500 text-white font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            🆕 New Game
          </button>
        </div>
      </div>
    </div>
  );
};


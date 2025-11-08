// Match History Component
window.MatchHistory = function({ isOpen, onClose }) {
  const { useState, useEffect } = React;
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    // Load match history from localStorage
    const historyKey = 'caro_match_history';
    const stored = localStorage.getItem(historyKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMatches(parsed);
      } catch (e) {
        console.error('Error parsing match history:', e);
      }
    }
  }, [isOpen]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModeLabel = (mode) => {
    if (!mode) return 'Unknown';
    if (mode.includes('PVE') || mode.includes('AI')) return 'vs AI';
    if (mode.includes('ONLINE')) return 'Online';
    if (mode.includes('LOCAL')) return 'Local';
    return mode;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div 
        className="glass-card w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'slideInUp 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">📊 Match History</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {matches.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-lg">No matches played yet</p>
              <p className="text-sm mt-2">Your game history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match, index) => (
                <div
                  key={index}
                  className="bg-slate-800/50 rounded-lg p-4 border border-white/10 hover:border-caro-green/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`px-3 py-1 rounded-lg font-bold text-sm ${
                          match.winner === 'X' 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' 
                            : 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                        }`}>
                          {match.winner} Wins
                        </div>
                        <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
                          {getModeLabel(match.mode)}
                        </span>
                      </div>
                      <div className="text-sm text-slate-300">
                        <span className="font-semibold text-blue-400">{match.playerX || 'Player X'}</span>
                        {' vs '}
                        <span className="font-semibold text-orange-400">{match.playerO || 'Player O'}</span>
                      </div>
                      {match.betAmount && (
                        <div className="text-xs text-slate-400 mt-1">
                          Bet: <span className="text-caro-green font-semibold">{match.betAmount.toLocaleString()} VNĐ</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">
                        {formatDate(match.timestamp)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {match.moveCount || 0} moves
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-between items-center">
          <div className="text-sm text-slate-400">
            Total: {matches.length} match{matches.length !== 1 ? 'es' : ''}
          </div>
          <button
            onClick={() => {
              if (confirm('Clear all match history?')) {
                localStorage.removeItem('caro_match_history');
                setMatches([]);
              }
            }}
            className="px-4 py-2 bg-red-800/50 hover:bg-red-800 text-white rounded-lg text-sm transition-colors"
            disabled={matches.length === 0}
          >
            Clear History
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInUp {
          from { 
            transform: translateY(20px);
            opacity: 0;
          }
          to { 
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};


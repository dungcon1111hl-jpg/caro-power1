// Lobby Scene
window.LobbyScene = function({ config, scores, onPlayAI, onQuickMatch, onSettings, onCreateRoom, onJoinRoom }) {
  const { useEffect, useState } = React;
  const [showHistory, setShowHistory] = useState(false);

  // ✅ Log khi mount để debug
  useEffect(() => {
    console.log('🏠 Lobby Scene mounted');
    return () => console.log('🏠 Lobby Scene unmounted');
  }, []);

  return (
    <div className="scene-container">
      {/* Stars Background */}
      <div className="stars"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>

      {/* Title */}
      <h1 className="neon-text">Caro Power 3D</h1>

      {/* Welcome Message */}
      <div className="text-center" style={{ marginTop: '-10px', marginBottom: '5px' }}>
        <p className="text-slate-300 text-base md:text-lg font-light">
          Hello, <span className="font-bold text-white">{config.username || 'Player'}</span>!
        </p>
        <p className="text-slate-400 text-sm mt-1">Infinite Board - Expand as you play! 🎯</p>
      </div>

      {/* Main Menu */}
      <div className="wrapper">
        <button 
          className="neon-button"
          onClick={() => onPlayAI('Normal')}
        >
          🤖 Play vs AI (Normal)
        </button>
        
        <div className="grid grid-cols-2 gap-3 w-full">
          <button 
            className="neon-button"
            style={{ fontSize: 'clamp(0.85rem, 3vw, 1rem)', padding: 'clamp(10px, 2vh, 14px) clamp(15px, 3vw, 25px)' }}
            onClick={() => onPlayAI('Easy')}
          >
            AI Easy
          </button>
          <button 
            className="neon-button"
            style={{ fontSize: 'clamp(0.85rem, 3vw, 1rem)', padding: 'clamp(10px, 2vh, 14px) clamp(15px, 3vw, 25px)' }}
            onClick={() => onPlayAI('Hard')}
          >
            AI Hard
          </button>
        </div>
        
        <button 
          className="neon-button"
          onClick={onQuickMatch}
        >
          🌐 Find Online Match
        </button>
        
        <button 
          className="neon-button"
          onClick={onCreateRoom}
        >
          🎮 Create Room
        </button>
        
        <button 
          className="neon-button"
          onClick={onJoinRoom}
        >
          🔑 Join Room
        </button>

        <button 
          className="neon-button"
          onClick={onSettings}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Stats */}
      <div className="glass-card p-5 w-full max-w-md mt-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">📊 Statistics</h3>
          <button
            className="px-3 py-1 rounded border border-white/10 bg-slate-800/50 hover:bg-slate-700 text-white transition-colors text-sm"
            onClick={() => setShowHistory(true)}
          >
            📜 History
          </button>
        </div>
        <div className="flex justify-around text-center">
          <div>
            <div className="text-3xl font-bold" style={{color: config.skins.X.primary}}>{scores.X}</div>
            <div className="text-sm text-slate-400">X Wins</div>
          </div>
          <div className="w-px bg-slate-700"></div>
          <div>
            <div className="text-3xl font-bold" style={{color: config.skins.O.primary}}>{scores.O}</div>
            <div className="text-sm text-slate-400">O Wins</div>
          </div>
        </div>
      </div>

      {/* Match History */}
      {window.MatchHistory && (
        <window.MatchHistory
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Platform Logos */}
      <div className="platforms">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Telegram_2019_Logo.svg/2048px-Telegram_2019_Logo.svg.png" 
          alt="Telegram" 
          className="platform-logo"
        />
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/2023_Facebook_icon.svg/2048px-2023_Facebook_icon.svg.png" 
          alt="Facebook" 
          className="platform-logo"
        />
        <img 
          src="https://sf-static.upanhlaylink.com/img/image_2025102774b41eb48c4d30b2ff10426fa4fe4fad.jpg" 
          alt="Web" 
          className="platform-logo"
        />
      </div>

      {/* Version */}
      <div className="text-slate-500 text-xs mt-2">v14.0 - Infinite Board Edition</div>
    </div>
  );
};
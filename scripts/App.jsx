// Main Application Component
window.App = function() {
  const { useState, useEffect } = React;
  const { Screens, DefaultConfig, SCORES_KEY, CONFIG_KEY, Modes } = window.CaroConfig;
  
  const [config, setConfig] = useState(() => {
    const v = localStorage.getItem(CONFIG_KEY);
    return v ? { ...DefaultConfig, ...JSON.parse(v) } : DefaultConfig;
  });

  const [screen, setScreen] = useState(Screens.LOAD);
  const [scores, setScores] = useState(() => {
    const s = localStorage.getItem(SCORES_KEY);
    return s ? JSON.parse(s) : { X: 0, O: 0 };
  });

  const [showUsernameModal, setShowUsernameModal] = useState(!config.username);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);

  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    if (showWelcomeToast) {
      const timer = setTimeout(() => setShowWelcomeToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showWelcomeToast]);

  const startAI = (lvl) => {
    setScreen({ id: Screens.GAME, mode: Modes.PVE, aiStyle: lvl });
  };
  
  const startQuick = () => {
    setScreen(Screens.MATCH);
  };

  const handleUsernameSubmit = (name) => {
    setConfig({ ...config, username: name });
    setShowUsernameModal(false);
    setShowWelcomeToast(true);
  };

  const renderScreen = () => {
    if (screen === Screens.LOAD && window.LoadingScene) {
      return <window.LoadingScene onDone={() => setScreen(Screens.LOBBY)} />;
    }
    
    if (screen === Screens.LOBBY && window.LobbyScene) {
      return <window.LobbyScene 
        config={config} 
        scores={scores} 
        onPlayAI={startAI} 
        onQuickMatch={startQuick} 
        onSettings={() => setScreen({ id: Screens.SETTINGS, from: Screens.LOBBY })}
        onCreateRoom={() => setScreen(Screens.CREATE_ROOM)}
        onJoinRoom={() => setScreen(Screens.JOIN_ROOM)}
      />;
    }
    
    if (screen === Screens.MATCH && window.MatchmakingScene) {
      return <window.MatchmakingScene 
        config={config}
        onCancel={() => setScreen(Screens.LOBBY)} 
        onMatched={(payload) => {
          console.log('🎮 Match found:', payload);
          if (payload?.role) {
            setScreen({ id: Screens.GAME, mode: Modes.ONLINE, opponent: payload.opponent, role: payload.role });
          } else {
            // Đảm bảo bot object có đầy đủ thông tin
            const opponent = payload?.isBot || payload?.isAI 
              ? { ...payload, isAI: true, isBot: payload?.isBot !== false }
              : payload;
            console.log('🎮 Starting game with opponent:', opponent);
            setScreen({ id: Screens.GAME, mode: Modes.LOCAL, opponent: opponent });
          }
        }} 
      />;
    }
    
    if (typeof screen === 'object' && screen.id === Screens.GAME && window.GameScene) {
      return <window.GameScene 
        config={config} 
        onConfigChange={setConfig}
        mode={screen.mode} 
        aiStyle={screen.aiStyle || 'Normal'}
        opponent={screen.opponent || null}
        onExit={() => setScreen(Screens.LOBBY)} 
        onFinish={(w) => {
          setScores(prev => ({ ...prev, [w]: prev[w] + 1 }));
        }} 
      />;
    }
    
    if (screen === Screens.CREATE_ROOM && window.CreateRoomScene) {
      return <window.CreateRoomScene 
        config={config}
        onBack={() => setScreen(Screens.LOBBY)}
        onRoomCreated={(data) => {
          // Room created, stay on create room screen to show room ID
          // Could also navigate to game if needed
        }}
      />;
    }
    
    if (screen === Screens.JOIN_ROOM && window.JoinRoomScene) {
      return <window.JoinRoomScene 
        config={config}
        onBack={() => setScreen(Screens.LOBBY)}
        onRoomJoined={(payload) => {
          if (payload?.role) {
            setScreen({ id: Screens.GAME, mode: Modes.ONLINE, opponent: payload.opponent, role: payload.role });
          } else {
            setScreen({ id: Screens.GAME, mode: Modes.LOCAL, opponent: payload });
          }
        }}
      />;
    }
    
    if (typeof screen === 'object' && screen.id === Screens.SETTINGS && window.SettingsScene) {
      return <window.SettingsScene 
        config={config} 
        onChange={setConfig} 
        onBack={() => setScreen(screen.from || Screens.LOBBY)} 
      />;
    }
    
    // Fallback to Lobby
    if (window.LobbyScene) {
      return <window.LobbyScene 
        config={config} 
        scores={scores} 
        onPlayAI={startAI} 
        onQuickMatch={startQuick} 
        onSettings={() => setScreen({ id: Screens.SETTINGS, from: Screens.LOBBY })}
        onCreateRoom={() => setScreen(Screens.CREATE_ROOM)}
        onJoinRoom={() => setScreen(Screens.JOIN_ROOM)}
      />;
    }
    
    // Ultimate fallback
    return <div className="p-8 text-white">Loading components...</div>;
  };

  return (
    <React.Fragment>
      {renderScreen()}
      {showUsernameModal && window.UsernameModal && <window.UsernameModal onSubmit={handleUsernameSubmit} />}
      {showWelcomeToast && window.WelcomeToast && <window.WelcomeToast username={config.username} />}
    </React.Fragment>
  );
};

// Initialize Application
(function() {
  // Wait for all components to be defined
  function init() {
    if (!window.App || !window.LobbyScene || !window.MatchmakingScene || !window.GameScene || !window.SettingsScene || !window.CreateRoomScene || !window.JoinRoomScene) {
      setTimeout(init, 50);
      return;
    }
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<window.App />);
  }
  init();
})();
// Matchmaking Scene - Tự động ghép bot nếu không tìm thấy người chơi
window.MatchmakingScene = function({ config, onCancel, onMatched }) {
  const { useState, useEffect } = React;
  const [elapsedTime, setElapsedTime] = useState(0);
  const MATCH_TIMEOUT = window.BotSystem?.config?.matchTimeoutSeconds || 15; // 15 giây mặc định
  
  useEffect(() => {
    const startTime = performance.now();
    let mounted = true;
    let timeoutId = null;
    let timerInterval = null;

    // Update elapsed time every 200ms
    timerInterval = setInterval(() => {
      if (mounted) {
        setElapsedTime(Math.floor((performance.now() - startTime) / 1000));
      }
    }, 200);

    // Try to find online match
    (async () => {
      let foundOnlineMatch = false;
      
      // Thử kết nối online (im lặng, không log lỗi)
      try {
        if (window.CaroNet) {
          try {
            if (!window.CaroNet.user && config?.username) {
              await window.CaroNet.login(config.username || window.CaroUtils.randomName());
            }
          } catch (loginError) {
            // Im lặng - không log lỗi
          }

          try {
            if (window.CaroNet && !window.CaroNet.io) {
              await window.CaroNet.connect();
            }
            if (window.CaroNet.io) {
              window.CaroNet.onMatched((payload) => {
                if (!mounted) return;
                foundOnlineMatch = true;
                onMatched(payload);
              });
              window.CaroNet.enqueue();
              // Đợi một chút để xem có match không
              await new Promise(resolve => setTimeout(resolve, 2000));
              if (foundOnlineMatch) return; // Đã tìm thấy match online
            }
          } catch (connectionError) {
            // Im lặng - không log lỗi
          }
        }
      } catch (e) {
        // Im lặng - không log lỗi
      }

      // Fallback: Tự động ghép bot sau timeout hoặc random bot
      const shouldUseBot = window.BotSystem?.shouldMatchWithBot() || false;
      
      if (shouldUseBot) {
        // Ghép bot ngay lập tức với tỉ lệ 30-50%
        setTimeout(() => {
          if (!mounted || foundOnlineMatch) return;
          
          // Đảm bảo BotSystem tồn tại
          if (!window.BotSystem) {
            // Fallback nếu BotSystem chưa load
            const difficulties = ['Easy', 'Normal', 'Hard'];
            const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
            const bot = {
              name: `AI ${randomDifficulty}`,
              elo: Math.floor(1200 + Math.random() * 400),
              avatar: '🤖',
              isAI: true,
              isBot: true,
              aiStyle: randomDifficulty,
              difficulty: randomDifficulty
            };
            onMatched(bot);
            return;
          }
          
          const bot = window.BotSystem.createBotOpponent();
          console.log('🤖 Bot matched (immediate):', bot);
          onMatched(bot);
        }, 500); // Đợi 500ms để tránh conflict với online match
        return;
      }
      
      // Nếu không ghép bot ngay, đợi timeout rồi ghép bot
      timeoutId = setTimeout(() => {
        if (!mounted || foundOnlineMatch) return;
        
        // Tạo bot với độ khó ngẫu nhiên
        const difficulties = ['Easy', 'Normal', 'Hard'];
        const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
        
        // Đảm bảo BotSystem tồn tại
        let bot;
        if (window.BotSystem) {
          bot = window.BotSystem.createBotOpponent(randomDifficulty);
        } else {
          // Fallback nếu BotSystem chưa load
          bot = {
            name: `AI ${randomDifficulty}`,
            elo: Math.floor(1200 + Math.random() * 400),
            avatar: '🤖',
            isAI: true,
            isBot: true,
            aiStyle: randomDifficulty,
            difficulty: randomDifficulty
          };
        }

        console.log('🤖 Bot matched (timeout):', bot);
        onMatched(bot);
      }, MATCH_TIMEOUT * 1000);
    })();
    
    return () => {
      mounted = false;
      if (timerInterval) clearInterval(timerInterval);
      if (timeoutId) clearTimeout(timeoutId);
      try { window.CaroNet?.dequeue(); } catch {}
    };
  }, [config]);

  // Calculate remaining time until AI match
  const remainingSeconds = Math.max(0, MATCH_TIMEOUT - elapsedTime);
  const progressPercent = Math.min(100, (elapsedTime / MATCH_TIMEOUT) * 100);
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-50">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-card p-8 md:p-10 text-center shadow-2xl">
          {/* Icon/Logo */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-caro-green to-cyan-400 mb-4 animate-pulse">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-caro-green via-cyan-400 to-caro-green bg-clip-text text-transparent animate-gradient" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
            Finding Opponent...
          </h2>
          
          {/* Time Display */}
          <div className="mb-6">
            <div className="text-5xl md:text-6xl font-bold text-caro-green mb-2 font-mono" style={{ fontFamily: "'Inter', 'Poppins', monospace" }}>
              {elapsedTime}s
            </div>
            <div className="text-slate-400 text-sm" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>Time Elapsed</div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-caro-green to-cyan-400 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <div className="text-xs text-slate-400" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
              {remainingSeconds > 0 
                ? `Auto-match bot in ${remainingSeconds}s`
                : 'Matching bot...'
              }
            </div>
          </div>
          
          {/* Status Info */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-center gap-2 text-slate-300">
              <div className="w-2 h-2 rounded-full bg-caro-green animate-pulse"></div>
              <span className="text-sm" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>Searching for online players...</span>
            </div>
            
            <div className="glass-card p-4 mt-4">
              <div className="text-xs text-slate-400 mb-2" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>Bot System</div>
              <div className="flex items-center justify-between text-sm" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
                <span className="text-slate-300">Bot Match Rate:</span>
                <span className="text-caro-green font-semibold">
                  {window.BotSystem?.config?.botMatchProbability ? Math.round(window.BotSystem.config.botMatchProbability * 100) : 40}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
                <span className="text-slate-300">Difficulty:</span>
                <span className="text-cyan-400 font-semibold">Easy / Normal / Hard</span>
              </div>
            </div>
          </div>
          
          {/* Cancel Button */}
          <button 
            className="w-full px-6 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-slate-500 text-white font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
            onClick={onCancel}
            style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}
          >
            Cancel Search
          </button>
        </div>
      </div>
      
      {/* Custom Styles */}
      <style>{`
        @keyframes animate-gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient {
          background-size: 200% auto;
          animation: animate-gradient 3s linear infinite;
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};
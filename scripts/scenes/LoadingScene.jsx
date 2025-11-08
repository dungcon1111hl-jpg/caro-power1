// Loading Scene - Premium Design
window.LoadingScene = function({ onDone }) {
  const { useEffect, useState } = React;
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing...');
  
  useEffect(() => {
    const steps = [
      { delay: 0, progress: 0, text: 'Initializing...' },
      { delay: 300, progress: 25, text: 'Loading assets...' },
      { delay: 800, progress: 50, text: 'Preparing board...' },
      { delay: 1300, progress: 75, text: 'Loading AI engine...' },
      { delay: 1800, progress: 95, text: 'Almost ready...' },
      { delay: 2200, progress: 100, text: 'Ready!' }
    ];
    
    const timers = steps.map(step => 
      setTimeout(() => {
        setProgress(step.progress);
        setLoadingText(step.text);
      }, step.delay)
    );
    
    const completeTimer = setTimeout(onDone, 2500);
    
    return () => {
      timers.forEach(t => clearTimeout(t));
      clearTimeout(completeTimer);
    };
  }, []);

  const tips = [
    ' Tip: Use Erase skill to erase enemy troops!',
    'Tip: AI Hard is very difficult, be careful!',
    'Tip: Double skill allows you to make 2 consecutive moves!',
    'Tip: Lock to block the opponent\'s attack path!',
    'Tip: Try changing the theme in Settings!',
  ];
  
  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  return (
    <div className="loading-screen-premium">
      {/* Animated Background */}
      <div className="stars"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      
      {/* Gradient Orbs */}
      <div className="gradient-orb orb-1"></div>
      <div className="gradient-orb orb-2"></div>
      <div className="gradient-orb orb-3"></div>
      
      {/* Main Content */}
      <div className="loading-content">
        {/* Logo Animation */}
        <div className="logo-container">
          <div className="logo-glow"></div>
          <div className="logo-symbol">
            {/* <div className="symbol-x">✕</div>
            <div className="symbol-o">◯</div> */}
          </div>
          <h1 className="logo-text">
            <span className="logo-caro">CARO</span>
            <span className="logo-power">POWER</span>
            <span className="logo-3d">3D</span>
          </h1>
        </div>
        
        {/* Progress Section */}
        <div className="progress-section">
          <div className="progress-bar-container">
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progress}%` }}
              >
                <div className="progress-shimmer"></div>
              </div>
            </div>
            <div className="progress-percentage">{progress}%</div>
          </div>
          
          <p className="loading-status">{loadingText}</p>
        </div>
        
        {/* Tip Section */}
        <div className="tip-container">
          <p className="tip-text">{randomTip}</p>
        </div>
        
        {/* Spinner Decoration */}
        <div className="spinner-container">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
      </div>
      
      {/* Bottom Info */}
      <div className="loading-footer">
        <p className="version-text">v13.2 - Neon Edition</p>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};
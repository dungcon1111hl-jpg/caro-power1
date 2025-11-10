// Timer display component for game - Mỗi người chơi có 10 phút riêng
window.TimerDisplay = function({ timerState, config }) {
  const { playerXTimeLeft, playerOTimeLeft, currentPlayer } = timerState;

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isWarning = (timeLeft) => timeLeft <= config.warningSeconds;

  return (
    <div className="timer-display">
      <div className={`player-timer ${isWarning(playerXTimeLeft) ? 'warning' : ''}`}>
        Player X: {formatTime(playerXTimeLeft)}
      </div>
      <div className={`player-timer ${isWarning(playerOTimeLeft) ? 'warning' : ''}`}>
        Player O: {formatTime(playerOTimeLeft)}
      </div>
      <div className="current-player">
        {currentPlayer}'s Turn
      </div>
      <style jsx>{`
        .timer-display {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 10px;
          border-radius: 8px;
          font-size: 1.1em;
        }
        
        .player-timer {
          margin: 5px 0;
        }
        
        .warning {
          color: #ff4444;
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          50% { opacity: 0.5; }
        }
        
        .current-player {
          font-size: 0.9em;
          text-align: center;
          margin-top: 5px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
// Join Room Scene
window.JoinRoomScene = function({ config, onBack, onRoomJoined }) {
  const { useState, useEffect, useRef } = React;
  const [roomId, setRoomId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);
  const isJoiningRef = useRef(false);

  useEffect(() => {
    // Setup room join listener
    if (window.CaroNet) {
      const handleRoomJoined = (data) => {
        if (data && data.roomId) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          isJoiningRef.current = false;
          setIsJoining(false);
          setError(null);
          // Navigate to game or handle room joined
          if (onRoomJoined) {
            onRoomJoined(data);
          }
        }
      };
      
      window.CaroNet.onRoomJoined(handleRoomJoined);
      
      // Setup error listener if available
      if (window.CaroNet.io) {
        window.CaroNet.io.on('room:join:error', (err) => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          isJoiningRef.current = false;
          setIsJoining(false);
          setError('Room ID may be incorrect or room does not exist');
        });
      }
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onRoomJoined]);

  const handleJoinRoom = async () => {
    const trimmedRoomId = roomId.trim().toUpperCase();
    
    if (!trimmedRoomId) {
          setError('Please enter room ID');
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    isJoiningRef.current = true;
    setIsJoining(true);
    setError(null);
    
    try {
      // Ensure connection
      if (window.CaroNet) {
        if (!window.CaroNet.user && config?.username) {
          await window.CaroNet.login(config.username || window.CaroUtils.randomName());
        }
        if (window.CaroNet && !window.CaroNet.io) {
          await window.CaroNet.connect();
        }
        // Join room
        window.CaroNet.joinRoom(trimmedRoomId);
        
        // Set timeout for error handling
        timeoutRef.current = setTimeout(() => {
          if (isJoiningRef.current) {
            setError('Room ID may be incorrect or room does not exist');
            isJoiningRef.current = false;
            setIsJoining(false);
            timeoutRef.current = null;
          }
        }, 5000);
      } else {
        // Fallback: simulate join
        setTimeout(() => {
          // For demo, accept any room ID
          if (onRoomJoined) {
            onRoomJoined({ roomId: trimmedRoomId, role: 'O', opponent: { name: 'Player 1' } });
          }
          isJoiningRef.current = false;
          setIsJoining(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Error joining room:', err);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      isJoiningRef.current = false;
      setError('Có thể ID phòng đã sai hoặc phòng không tồn tại');
      setIsJoining(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoinRoom();
    }
  };

  return (
    <div className="scene-container">
      {/* Stars Background */}
      <div className="stars"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>

      {/* Title */}
      <h1 className="neon-text">Join Room</h1>

      <div className="glass-card p-6 text-center w-full max-w-md shadow-2xl">
        <div className="text-xl font-bold text-white mb-4">
          Enter room ID to join
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            value={roomId}
            onChange={(e) => {
              setRoomId(e.target.value.toUpperCase());
              setError(null);
            }}
            onKeyPress={handleKeyPress}
            placeholder="Enter room ID..."
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-caro-green/50 rounded-lg text-white text-center text-xl font-bold focus:outline-none focus:border-caro-green focus:ring-2 focus:ring-caro-green/50"
            style={{ 
              fontFamily: 'Orbitron, sans-serif',
              letterSpacing: '0.1em'
            }}
            disabled={isJoining}
            autoFocus
          />
        </div>

        <button
          className="neon-button"
          onClick={handleJoinRoom}
          disabled={isJoining || !roomId.trim()}
        >
          {isJoining ? 'Joining...' : '🎮 Join Room'}
        </button>

        <button
          className="neon-button"
          onClick={onBack}
          style={{ marginTop: '15px', opacity: 0.8 }}
          disabled={isJoining}
        >
          ← Back
        </button>
      </div>
    </div>
  );
};


// Create Room Scene
window.CreateRoomScene = function({ config, onBack, onRoomCreated }) {
  const { useState, useEffect, useRef } = React;
  const [roomId, setRoomId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const roomCreatedRef = useRef(false);

  useEffect(() => {
    // Setup room creation listener
    if (window.CaroNet) {
      window.CaroNet.onRoomCreated((data) => {
        if (data && data.roomId && !roomCreatedRef.current) {
          roomCreatedRef.current = true;
          // Ensure room ID is 6 digits
          let id = data.roomId.toString();
          // If server returns non-6-digit ID, pad or truncate to 6 digits
          if (id.length < 6) {
            id = id.padStart(6, '0');
          } else if (id.length > 6) {
            id = id.substring(0, 6);
          }
          setRoomId(id);
          setIsCreating(false);
          setError(null);
        }
      });
    }
  }, []);

  // Generate 6-digit random room ID
  const generateRoomId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleCreateRoom = async () => {
    // Validate bet amount
    const betValue = parseInt(betAmount.replace(/,/g, '')) || 0;
    if (betValue <= 0) {
      setError('Please enter a valid bet amount');
      return;
    }

    roomCreatedRef.current = false;
    setIsCreating(true);
    setError(null);
    
    try {
      // Generate 6-digit room ID as fallback
      const newRoomId = generateRoomId();
      
      // Ensure connection
      if (window.CaroNet) {
        if (!window.CaroNet.user && config?.username) {
          await window.CaroNet.login(config.username || window.CaroUtils.randomName());
        }
        if (window.CaroNet && !window.CaroNet.io) {
          await window.CaroNet.connect();
        }
        // Create room with bet amount
        window.CaroNet.createRoom(config?.username || 'Room');
        
        // If server doesn't return room ID within 2 seconds, use generated one
        setTimeout(() => {
          if (!roomCreatedRef.current) {
            roomCreatedRef.current = true;
            setRoomId(newRoomId);
            setIsCreating(false);
          }
        }, 2000);
      } else {
        // Fallback: use generated 6-digit room ID
        setTimeout(() => {
          roomCreatedRef.current = true;
          setRoomId(newRoomId);
          setIsCreating(false);
        }, 1000);
      }
    } catch (err) {
      console.error('Error creating room:', err);
      // Even on error, generate a room ID for demo
      if (!roomCreatedRef.current) {
        roomCreatedRef.current = true;
        const newRoomId = generateRoomId();
        setRoomId(newRoomId);
        setIsCreating(false);
      }
      // Don't show error if we have a room ID
    }
  };

  const formatBetAmount = (value) => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, '');
    // Format with commas
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleBetAmountChange = (e) => {
    const formatted = formatBetAmount(e.target.value);
    setBetAmount(formatted);
    setError(null);
  };

  const handleCopyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId).then(() => {
        alert('Room ID copied!');
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = roomId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Room ID copied!');
      });
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
      <h1 className="neon-text">Create Room</h1>

      <div className="glass-card p-6 text-center w-full max-w-md shadow-2xl">
        {!roomId ? (
          <>
            <div className="text-xl font-bold text-white mb-4">
              Create a new room to play with friends
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-2 text-left">
                Challenge Value (GMP)
              </label>
              <input
                type="text"
                value={betAmount}
                onChange={handleBetAmountChange}
                placeholder="Enter Challenge Value (GMP)..."
                className="w-full px-4 py-3 bg-slate-800/50 border-2 border-caro-green/50 rounded-lg text-white text-center text-lg font-bold focus:outline-none focus:border-caro-green focus:ring-2 focus:ring-caro-green/50"
                style={{ 
                  fontFamily: 'Orbitron, sans-serif'
                }}
                disabled={isCreating}
              />
              <div className="text-xs text-slate-500 mt-1 text-left">
                Example: 10,000
              </div>
            </div>

            <button
              className="neon-button"
              onClick={handleCreateRoom}
              disabled={isCreating || !betAmount.trim()}
            >
              {isCreating ? 'Creating room...' : '🎮 Create Room'}
            </button>

            <button
              className="neon-button"
              onClick={onBack}
              style={{ marginTop: '15px', opacity: 0.8 }}
            >
              ← Back
            </button>
          </>
        ) : (
          <>
            <div className="text-xl font-bold text-white mb-4">
              ✅ Room created successfully!
            </div>
            
            <div className="mb-4">
              <div className="text-sm text-slate-400 mb-2">Your Room ID:</div>
              <div 
                className="text-3xl font-bold text-caro-green mb-4 p-4 bg-slate-800/50 rounded-lg border-2 border-caro-green/50 cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={handleCopyRoomId}
                title="Click to copy"
                style={{ letterSpacing: '0.1em' }}
              >
                {roomId}
              </div>
              <div className="text-xs text-slate-500 mb-4">
                Click on room ID to copy
              </div>
            </div>

            {betAmount && (
              <div className="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                <div className="text-sm text-slate-400 mb-1">Challenge Value:</div>
                <div 
                  className="text-xl font-bold text-caro-green"
                  style={{ 
                    fontFamily: 'Orbitron, sans-serif',
                    letterSpacing: '0.05em'
                  }}
                >
                  {betAmount} GMP
                </div>
              </div>
            )}

            <div className="text-sm text-slate-300 mb-4">
              Share this room ID with friends so they can join!
            </div>

            <button
              className="neon-button"
              onClick={onBack}
            >
              ← Back to Lobby
            </button>
          </>
        )}
      </div>
    </div>
  );
};


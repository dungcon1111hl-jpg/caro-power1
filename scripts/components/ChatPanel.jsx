// Chat Panel Component
window.ChatPanel = function({ config, mode, opponent, onClose, isOpen }) {
  const { useState, useEffect, useRef } = React;
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [messages, setMessages] = useState({}); // { playerId: [messages] }
  const [inputMessage, setInputMessage] = useState('');
  const [typingPlayers, setTypingPlayers] = useState(new Set());
  const [players, setPlayers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef({});
  const inputRef = useRef(null);

  // Get current user info
  const currentUser = {
    id: config?.username || 'You',
    name: config?.username || 'You'
  };

  // Initialize players list
  useEffect(() => {
    const initialPlayers = [];
    
    // Add current user
    initialPlayers.push({
      id: currentUser.id,
      name: currentUser.name,
      role: 'X'
    });

    // Add opponent
    if (opponent) {
      initialPlayers.push({
        id: opponent.name || opponent.id || 'Opponent',
        name: opponent.name || 'Opponent',
        role: 'O'
      });
    } else if (mode === window.CaroConfig.Modes.PVE) {
      initialPlayers.push({
        id: 'AI',
        name: 'AI',
        role: 'O'
      });
    }

    setPlayers(initialPlayers);
    
    // Select first player by default
    if (initialPlayers.length > 1 && !selectedPlayer) {
      setSelectedPlayer(initialPlayers[1]);
    }
  }, [opponent, mode]);

  // Setup chat listeners
  useEffect(() => {
    if (!window.CaroNet || !window.CaroNet.io) return;

    const handleChatMessage = (data) => {
      if (!data || !data.from || !data.message) return;
      
      const senderId = data.from.id || data.from.name || data.from;
      const targetId = data.to || selectedPlayer?.id; // Private message target
      
      // Only show message if it's for the current conversation or if no target (public)
      if (targetId && selectedPlayer?.id !== targetId && senderId !== currentUser.id) {
        return; // Message is for another conversation
      }

      const message = {
        id: Date.now() + Math.random(),
        from: senderId,
        text: data.message,
        timestamp: Date.now()
      };

      // Store message in the conversation with the sender
      // For private messages, use the conversation ID (either sender or receiver)
      setMessages(prev => {
        const newMessages = { ...prev };
        // Determine conversation ID: if it's a message TO us FROM them, use their ID
        // If it's a message FROM us TO them, use their ID
        const conversationId = (senderId === currentUser.id) ? targetId : senderId;
        if (!newMessages[conversationId]) {
          newMessages[conversationId] = [];
        }
        newMessages[conversationId].push(message);
        return newMessages;
      });

      // Clear typing indicator
      setTypingPlayers(prev => {
        const next = new Set(prev);
        next.delete(senderId);
        return next;
      });
    };

    const handleTyping = (data) => {
      if (!data || !data.from) return;
      const senderId = data.from.id || data.from.name || data.from;
      
      setTypingPlayers(prev => new Set(prev).add(senderId));

      // Clear typing after 3 seconds
      if (typingTimeoutRef.current[senderId]) {
        clearTimeout(typingTimeoutRef.current[senderId]);
      }
      typingTimeoutRef.current[senderId] = setTimeout(() => {
        setTypingPlayers(prev => {
          const next = new Set(prev);
          next.delete(senderId);
          return next;
        });
      }, 3000);
    };

    window.CaroNet.onChat(handleChatMessage);
    
    // Listen for typing events if available
    if (window.CaroNet.io) {
      window.CaroNet.io.on('chat:typing', handleTyping);
    }

    return () => {
      Object.values(typingTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
      if (window.CaroNet.io) {
        window.CaroNet.io.off('chat:typing', handleTyping);
      }
    };
  }, [selectedPlayer]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedPlayer]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, selectedPlayer]);

  const handleSendMessage = () => {
    const trimmed = inputMessage.trim();
    if (!trimmed || !selectedPlayer) return;

    // Add message to local state immediately
    const message = {
      id: Date.now(),
      from: currentUser.id,
      text: trimmed,
      timestamp: Date.now()
    };

    setMessages(prev => {
      const newMessages = { ...prev };
      const targetId = selectedPlayer.id;
      if (!newMessages[targetId]) {
        newMessages[targetId] = [];
      }
      newMessages[targetId].push(message);
      return newMessages;
    });

    // Send via network if available
    if (window.CaroNet && window.CaroNet.sendChat && selectedPlayer) {
      // Send private message to selected player
      window.CaroNet.sendChat(trimmed);
      // If server supports private messages, include target
      if (window.CaroNet.io) {
        window.CaroNet.io.emit('chat:send', {
          roomId: window.CaroNet.roomId,
          message: trimmed,
          to: selectedPlayer.id
        });
      }
    }

    setInputMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    
    // Emit typing indicator
    if (window.CaroNet && window.CaroNet.io && selectedPlayer) {
      window.CaroNet.io.emit('chat:typing', {
        to: selectedPlayer.id
      });
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const currentMessages = selectedPlayer ? (messages[selectedPlayer.id] || []) : [];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end p-4"
      onClick={onClose}
      style={{
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div 
        className="glass-card w-full max-w-md h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'slideInRight 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">💬 Chat</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Player List */}
          <div className="w-1/3 border-r border-white/10 bg-slate-900/50 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs text-slate-400 mb-2 px-2">Players</div>
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                  className={`w-full text-left p-2 rounded-lg mb-1 transition-colors ${
                    selectedPlayer?.id === player.id
                      ? 'bg-caro-green/30 text-white border border-caro-green/50'
                      : 'hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="text-sm font-semibold truncate">{player.name}</div>
                  <div className="text-xs text-slate-500">{player.role}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedPlayer ? (
              <>
                {/* Chat Header */}
                <div className="p-3 border-b border-white/10 bg-slate-800/30">
                  <div className="text-sm font-semibold text-white">{selectedPlayer.name}</div>
                  <div className="text-xs text-slate-400">Chat with {selectedPlayer.name}</div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                  {currentMessages.length === 0 ? (
                    <div className="text-center text-slate-500 text-sm mt-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    currentMessages.map((msg) => {
                      const isOwn = msg.from === currentUser.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-lg p-2 ${
                              isOwn
                                ? 'bg-caro-green/30 text-white'
                                : 'bg-slate-700/50 text-slate-200'
                            }`}
                          >
                            {!isOwn && (
                              <div className="text-xs text-slate-400 mb-1">{msg.from}</div>
                            )}
                            <div className="text-sm">{msg.text}</div>
                            <div className="text-xs text-slate-400 mt-1 text-right">
                              {formatTime(msg.timestamp)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  {/* Typing Indicator */}
                  {typingPlayers.has(selectedPlayer.id) && (
                    <div className="flex justify-start">
                      <div className="bg-slate-700/50 rounded-lg p-2 text-slate-400 text-sm">
                        <span className="inline-block animate-pulse">typing...</span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-white/10 bg-slate-800/30">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-caro-green/50"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim()}
                      className="px-4 py-2 bg-caro-green hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                Select a player to start chatting
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInRight {
          from { 
            transform: translateX(100%);
            opacity: 0;
          }
          to { 
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};


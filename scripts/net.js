// Simple networking client for Socket.IO backend
;(function(){
  const Net = {
    io: null,
    token: null,
    user: null,
    roomId: null,
    role: null,
    opponent: null,
    baseUrl: (window.CARO_API_BASE || 'http://localhost:8080'),

    async login(username){
      const res = await fetch(this.baseUrl + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      if(!res.ok) throw new Error('login failed');
      const data = await res.json();
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('caro.jwt', this.token);
      localStorage.setItem('caro.user', JSON.stringify(this.user));
      return this.user;
    },

    async connect(){
      if (!window.io) throw new Error('Socket.IO not loaded');
      const token = this.token || localStorage.getItem('caro.jwt');
      if(!token) throw new Error('no token');
      await new Promise((resolve, reject) => {
        const s = window.io(this.baseUrl, { auth: { token } });
        this.io = s;
        s.on('connect', resolve);
        s.on('connect_error', reject);
      });
    },

    enqueue(){
      if(!this.io) throw new Error('not connected');
      this.io.emit('queue:join');
    },
    dequeue(){
      if(!this.io) return;
      this.io.emit('queue:leave');
    },

    // Matchmaking
    onMatched(handler){
      this.io?.on('queue:matched', (payload) => {
        this.roomId = payload.roomId;
        this.role = payload.role;
        this.opponent = payload.opponent;
        handler(payload);
      });
    },

    // Game sync
    onOpponentMove(handler){ this.io?.on('game:opponentMove', handler); },
    onGameEnded(handler){ this.io?.on('game:ended', handler); },
    sendMove(x, y, turn){ if(!this.roomId) return; this.io?.emit('game:move', { roomId: this.roomId, x, y, turn }); },

    // Chat & notices
    sendChat(message){ if(!this.roomId) return; this.io?.emit('chat:send', { roomId: this.roomId, message }); },
    onChat(handler){ this.io?.on('chat:message', handler); },
    onNotice(handler){ this.io?.on('system:notice', handler); },

    // Rooms (lobby)
    requestRooms(){ this.io?.emit('rooms:list'); },
    onRooms(handler){ this.io?.on('rooms:list', handler); },
    createRoom(name){ this.io?.emit('room:create', { name }); },
    onRoomCreated(handler){ this.io?.on('room:created', handler); },
    joinRoom(roomId){ this.io?.emit('room:join', { roomId }); },
    onRoomJoined(handler){ this.io?.on('room:joined', handler); },
  };

  window.CaroNet = Net;
})();



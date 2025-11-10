// Configuration Constants - INFINITE BOARD EDITION
window.CaroConfig = {
  Screens: { 
    LOAD: 'load', 
    LOBBY: 'lobby', 
    MATCH: 'match', 
    GAME: 'game', 
    SETTINGS: 'settings',
    CREATE_ROOM: 'create_room',
    JOIN_ROOM: 'join_room'
  },
  
  // 🌟 INFINITE BOARD SETTINGS
  INITIAL_BOARD_SIZE: 15,        // Bắt đầu với 15x15
  EXPAND_THRESHOLD: 3,           // Mở rộng khi còn cách mép 3 ô
  EXPAND_AMOUNT: 5,              // Thêm 5 ô mỗi lần mở rộng
  
  CELL_SIZE_DEFAULT: 56,
  TURN_SECONDS_DEFAULT: 30,
  ZOOM_MIN: 0.3,
  ZOOM_MAX: 3.0,
  
  SCORES_KEY: 'caro_scores',
  CONFIG_KEY: 'caro_config_v8_infinite',
  TIMER_CONFIG_KEY: 'caro_timer_config_v1',

  Skills: { 
    ERASE: 'erase', 
    DOUBLE: 'double', 
    LOCK: 'lock', 
    CONVERT: 'convert', 
    MOVE: 'move' 
  },
  
  SKILL_LIST: ['erase', 'double', 'lock', 'convert', 'move'],
  
  Modes: { 
    PVE: 'PvE (vs AI)', 
    LOCAL: 'Local PvP', 
    ONLINE: 'Online PvP (stub)', 
    FRIENDS: 'Play with Friends (stub)' 
  },
  
  AIStyles: { 
    EASY: 'Easy', 
    NORMAL: 'Normal', 
    HARD: 'Hard' 
  },

  DefaultConfig: {
    username: '',
    boardTheme: 'wood-3d',
    customBoardUrl: '',
    cellSize: 56,
    compactUI: false,
    sfxOn: true,
    skins: {
      X: { label: 'Blue X', primary: '#2f7df4' },
      O: { label: 'Orange O', primary: '#ff8a3c' },
    },
  },

  DefaultTimerConfig: {
    turnSeconds: 600, // 10 minutes = 600 seconds (configurable, not hardcoded)
    pauseOnOpponentTurn: true,
    warningSeconds: 60, // Warning when 1 minute left
  },

  DIRS: [[1, 0], [0, 1], [1, 1], [1, -1]]
};
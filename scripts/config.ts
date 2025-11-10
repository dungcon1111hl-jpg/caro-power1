// Configuration Constants - INFINITE BOARD EDITION with TypeScript
export interface CaroConfigType {
  Screens: {
    LOAD: string;
    LOBBY: string;
    MATCH: string;
    GAME: string;
    SETTINGS: string;
    CREATE_ROOM: string;
    JOIN_ROOM: string;
  };
  INITIAL_BOARD_SIZE: number;
  EXPAND_THRESHOLD: number;
  EXPAND_AMOUNT: number;
  CELL_SIZE_DEFAULT: number;
  TURN_SECONDS_DEFAULT: number;
  ZOOM_MIN: number;
  ZOOM_MAX: number;
  SCORES_KEY: string;
  CONFIG_KEY: string;
  TIMER_CONFIG_KEY: string;
  Skills: {
    ERASE: string;
    DOUBLE: string;
    LOCK: string;
    CONVERT: string;
    MOVE: string;
  };
  SKILL_LIST: string[];
  Modes: {
    PVE: string;
    LOCAL: string;
    ONLINE: string;
    FRIENDS: string;
  };
  AIStyles: {
    EASY: string;
    NORMAL: string;
    HARD: string;
  };
  DefaultConfig: {
    username: string;
    boardTheme: string;
    customBoardUrl: string;
    cellSize: number;
    compactUI: boolean;
    sfxOn: boolean;
    skins: {
      X: { label: string; primary: string };
      O: { label: string; primary: string };
    };
  };
  DefaultTimerConfig: {
    matchSeconds: number; // Tổng thời gian mỗi người chơi (600 giây = 10 phút)
    pauseOnOpponentTurn: boolean;
    warningSeconds: number;
  };
  DIRS: number[][];
}

export const CaroConfig: CaroConfigType = {
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
  INITIAL_BOARD_SIZE: 15,
  EXPAND_THRESHOLD: 3,
  EXPAND_AMOUNT: 5,
  
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
    matchSeconds: 600, // 10 minutes = 600 seconds per player (configurable)
    pauseOnOpponentTurn: true,
    warningSeconds: 60, // Warning when 1 minute left
  },

  DIRS: [[1, 0], [0, 1], [1, 1], [1, -1]]
};

// Export to window for backward compatibility
if (typeof window !== 'undefined') {
  (window as any).CaroConfig = CaroConfig;
}


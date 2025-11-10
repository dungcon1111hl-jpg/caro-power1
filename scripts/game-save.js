// Game Save/Resume System - Auto-save mỗi lượt và khôi phục từ localStorage
window.GameSaveManager = class {
  constructor() {
    this.SAVE_KEY = 'caro_game_save_v1';
    this.AUTO_SAVE_ENABLED = true;
  }

  // Lưu game state
  saveGameState(gameState) {
    try {
      const saveData = {
        version: 1,
        timestamp: Date.now(),
        mode: gameState.mode,
        aiStyle: gameState.aiStyle,
        opponent: gameState.opponent,
        cells: this.mapToArray(gameState.cells),
        current: gameState.current,
        moveCount: gameState.moveCount,
        usedSkills: this.setsToObject(gameState.usedSkills),
        activeSkill: gameState.activeSkill,
        pendingMoveData: gameState.pendingMoveData,
        pendingWin: gameState.pendingWin,
        winner: gameState.winner,
        bounds: gameState.bounds,
        zoom: gameState.zoom,
        pan: gameState.pan,
        turnToken: gameState.turnToken,
        running: gameState.running,
        config: gameState.config
      };
      
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
      console.log('💾 Game saved at', new Date().toLocaleTimeString());
      return true;
    } catch (e) {
      console.error('Error saving game:', e);
      return false;
    }
  }

  // Khôi phục game state
  loadGameState() {
    try {
      const saved = localStorage.getItem(this.SAVE_KEY);
      if (!saved) return null;
      
      const saveData = JSON.parse(saved);
      
      // Kiểm tra version và timestamp (không load game quá cũ - 7 ngày)
      const daysSinceSave = (Date.now() - saveData.timestamp) / (1000 * 60 * 60 * 24);
      if (daysSinceSave > 7) {
        console.log('⏰ Save file too old, clearing...');
        this.clearSave();
        return null;
      }
      
      return {
        mode: saveData.mode,
        aiStyle: saveData.aiStyle,
        opponent: saveData.opponent,
        cells: this.arrayToMap(saveData.cells),
        current: saveData.current || 'X',
        moveCount: saveData.moveCount || 0,
        usedSkills: this.objectToSets(saveData.usedSkills),
        activeSkill: saveData.activeSkill || null,
        pendingMoveData: saveData.pendingMoveData || null,
        pendingWin: saveData.pendingWin || null,
        winner: saveData.winner || null,
        bounds: saveData.bounds || { minX: -7, maxX: 7, minY: -7, maxY: 7 },
        zoom: saveData.zoom || 1,
        pan: saveData.pan || { x: 0, y: 0 },
        turnToken: saveData.turnToken || 0,
        running: saveData.running !== undefined ? saveData.running : true,
        config: saveData.config || null
      };
    } catch (e) {
      console.error('Error loading game:', e);
      this.clearSave();
      return null;
    }
  }

  // Xóa save
  clearSave() {
    try {
      localStorage.removeItem(this.SAVE_KEY);
      console.log('🗑️ Game save cleared');
    } catch (e) {
      console.error('Error clearing save:', e);
    }
  }

  // Kiểm tra có save không
  hasSave() {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  }

  // Helper: Convert Map to Array for JSON
  mapToArray(map) {
    return Array.from(map.entries());
  }

  // Helper: Convert Array back to Map
  arrayToMap(array) {
    return new Map(array || []);
  }

  // Helper: Convert Sets to Objects
  setsToObject(sets) {
    return {
      X: Array.from(sets.X || []),
      O: Array.from(sets.O || [])
    };
  }

  // Helper: Convert Objects back to Sets
  objectToSets(obj) {
    return {
      X: new Set(obj.X || []),
      O: new Set(obj.O || [])
    };
  }

  // Lấy thông tin save (không load full state)
  getSaveInfo() {
    try {
      const saved = localStorage.getItem(this.SAVE_KEY);
      if (!saved) return null;
      
      const saveData = JSON.parse(saved);
      return {
        timestamp: saveData.timestamp,
        mode: saveData.mode,
        moveCount: saveData.moveCount,
        current: saveData.current,
        hasWinner: !!saveData.winner
      };
    } catch (e) {
      return null;
    }
  }
};

window.gameSaveManager = new GameSaveManager();






// Timer Configuration Manager with localStorage persistence (JavaScript version for Babel)
window.TimerConfigManager = class {
  constructor() {
    if (TimerConfigManager.instance) {
      return TimerConfigManager.instance;
    }
    this.config = this.loadConfig();
    TimerConfigManager.instance = this;
  }

  static getInstance() {
    if (!TimerConfigManager.instance) {
      TimerConfigManager.instance = new TimerConfigManager();
    }
    return TimerConfigManager.instance;
  }

  getConfig() {
    return { ...this.config };
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  resetToDefault() {
    this.config = { ...window.CaroConfig.DefaultTimerConfig };
    this.saveConfig();
  }

  loadConfig() {
    try {
      const stored = localStorage.getItem(window.CaroConfig.TIMER_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          turnSeconds: typeof parsed.turnSeconds === 'number' && parsed.turnSeconds > 0 
            ? parsed.turnSeconds 
            : window.CaroConfig.DefaultTimerConfig.turnSeconds,
          pauseOnOpponentTurn: typeof parsed.pauseOnOpponentTurn === 'boolean' 
            ? parsed.pauseOnOpponentTurn 
            : window.CaroConfig.DefaultTimerConfig.pauseOnOpponentTurn,
          warningSeconds: typeof parsed.warningSeconds === 'number' && parsed.warningSeconds >= 0 
            ? parsed.warningSeconds 
            : window.CaroConfig.DefaultTimerConfig.warningSeconds,
        };
      }
    } catch (e) {
      console.error('Error loading timer config:', e);
    }
    return { ...window.CaroConfig.DefaultTimerConfig };
  }

  saveConfig() {
    try {
      localStorage.setItem(window.CaroConfig.TIMER_CONFIG_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.error('Error saving timer config:', e);
    }
  }
};

window.timerConfigManager = TimerConfigManager.getInstance();






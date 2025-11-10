// Injection Protection System (JavaScript version for Babel)
window.InjectionProtection = class {
  constructor() {
    if (InjectionProtection.instance) {
      return InjectionProtection.instance;
    }
    this.eventLog = [];
    this.maxLogSize = 1000;
    this.secretKey = this.generateSecretKey();
    this.setupProtection();
    InjectionProtection.instance = this;
  }

  static getInstance() {
    if (!InjectionProtection.instance) {
      InjectionProtection.instance = new InjectionProtection();
    }
    return InjectionProtection.instance;
  }

  generateSecretKey() {
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
    ].join('|');
    
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  setupProtection() {
    try {
      this.protectConsole();
      this.protectLocalStorage();
      this.detectDevTools();
    } catch (e) {
      console.warn('Protection setup failed:', e);
    }
  }

  protectConsole() {
    try {
      const originalLog = console.log;
      const self = this;
      console.log = function(...args) {
        originalLog.apply(console, args);
        if (args.some(arg => typeof arg === 'string' && arg.includes('inject'))) {
          self.logEvent('SUSPICIOUS_CONSOLE', { args });
        }
      };
    } catch (e) {
      console.warn('Console protection failed:', e);
    }
      originalLog.apply(console, args);
    };
  }

  protectLocalStorage() {
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;
    const self = this;
    
    localStorage.setItem = function(key, value) {
      if (key.includes('caro') && !self.isValidKey(key)) {
        self.logEvent('SUSPICIOUS_STORAGE_WRITE', { key, value: value.substring(0, 50) });
        throw new Error('Unauthorized storage access');
      }
      return originalSetItem.call(localStorage, key, value);
    };

    localStorage.getItem = function(key) {
      if (key.includes('caro') && !self.isValidKey(key)) {
        self.logEvent('SUSPICIOUS_STORAGE_READ', { key });
      }
      return originalGetItem.call(localStorage, key);
    };
  }

  isValidKey(key) {
    const validKeys = [
      'caro_config_v8_infinite',
      'caro_scores',
      'caro_timer_config_v1',
      'caro_match_history'
    ];
    return validKeys.includes(key);
  }

  detectDevTools() {
    let devtools = { open: false };
    const threshold = 160;
    const self = this;
    
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          self.logEvent('DEVTOOLS_OPENED', {});
        }
      } else {
        devtools.open = false;
      }
    }, 500);
  }

  logEvent(type, data) {
    const timestamp = Date.now();
    const hash = this.createHash(JSON.stringify({ type, data, timestamp }));
    
    this.eventLog.push({ timestamp, type, data, hash });
    
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    this.saveSecureLog({ timestamp, type, data, hash });
  }

  createHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  saveSecureLog(event) {
    try {
      const encrypted = this.simpleEncrypt(JSON.stringify(event));
      const logKey = 'caro_secure_log';
      const existing = localStorage.getItem(logKey);
      const logs = existing ? JSON.parse(this.simpleDecrypt(existing)) : [];
      logs.push(encrypted);
      
      if (logs.length > 100) logs.shift();
      
      localStorage.setItem(logKey, this.simpleEncrypt(JSON.stringify(logs)));
    } catch (e) {
      console.error('Error saving secure log:', e);
    }
  }

  simpleEncrypt(text) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ this.secretKey.charCodeAt(i % this.secretKey.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result);
  }

  simpleDecrypt(encrypted) {
    try {
      const text = atob(encrypted);
      let result = '';
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ this.secretKey.charCodeAt(i % this.secretKey.length);
        result += String.fromCharCode(charCode);
      }
      return result;
    } catch (e) {
      return '';
    }
  }

  validateMove(move) {
    if (typeof move.x !== 'number' || typeof move.y !== 'number') {
      this.logEvent('INVALID_MOVE_TYPE', { move });
      return false;
    }

    if (!['X', 'O'].includes(move.player)) {
      this.logEvent('INVALID_PLAYER', { move });
      return false;
    }

    const recentMoves = this.eventLog
      .filter(e => e.type === 'MOVE' && Date.now() - e.timestamp < 1000)
      .length;
    
    if (recentMoves > 10) {
      this.logEvent('SUSPICIOUS_MOVE_RATE', { move, recentMoves });
      return false;
    }

    this.logEvent('MOVE', { move });
    return true;
  }

  getEventLog() {
    return [...this.eventLog];
  }
};

window.injectionProtection = InjectionProtection.getInstance();






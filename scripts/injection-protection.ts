// Injection Protection System
export class InjectionProtection {
  private static instance: InjectionProtection;
  private eventLog: Array<{ timestamp: number; type: string; data: any; hash: string }> = [];
  private maxLogSize: number = 1000;
  private secretKey: string;

  private constructor() {
    // Generate a secret key based on browser fingerprint
    this.secretKey = this.generateSecretKey();
    this.setupProtection();
  }

  public static getInstance(): InjectionProtection {
    if (!InjectionProtection.instance) {
      InjectionProtection.instance = new InjectionProtection();
    }
    return InjectionProtection.instance;
  }

  private generateSecretKey(): string {
    // Create a fingerprint from browser properties
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private setupProtection(): void {
    // Protect critical functions
    this.protectConsole();
    this.protectLocalStorage();
    this.detectDevTools();
  }

  private protectConsole(): void {
    // Detect console tampering
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      // Check for suspicious patterns
      if (args.some(arg => typeof arg === 'string' && arg.includes('inject'))) {
        this.logEvent('SUSPICIOUS_CONSOLE', { args });
      }
      originalLog.apply(console, args);
    };
  }

  private protectLocalStorage(): void {
    // Monitor localStorage access
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;
    
    localStorage.setItem = (key: string, value: string) => {
      if (key.includes('caro') && !this.isValidKey(key)) {
        this.logEvent('SUSPICIOUS_STORAGE_WRITE', { key, value: value.substring(0, 50) });
        throw new Error('Unauthorized storage access');
      }
      return originalSetItem.call(localStorage, key, value);
    };

    localStorage.getItem = (key: string) => {
      if (key.includes('caro') && !this.isValidKey(key)) {
        this.logEvent('SUSPICIOUS_STORAGE_READ', { key });
      }
      return originalGetItem.call(localStorage, key);
    };
  }

  private isValidKey(key: string): boolean {
    // Whitelist of valid keys
    const validKeys = [
      'caro_config_v8_infinite',
      'caro_scores',
      'caro_timer_config_v1',
      'caro_match_history'
    ];
    return validKeys.includes(key);
  }

  private detectDevTools(): void {
    // Detect DevTools opening (basic detection)
    let devtools = { open: false, orientation: null as string | null };
    const threshold = 160;
    
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          this.logEvent('DEVTOOLS_OPENED', {});
        }
      } else {
        devtools.open = false;
      }
    }, 500);
  }

  public logEvent(type: string, data: any): void {
    const timestamp = Date.now();
    const hash = this.createHash(JSON.stringify({ type, data, timestamp }));
    
    this.eventLog.push({ timestamp, type, data, hash });
    
    // Keep log size manageable
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    // Save to secure storage (encrypted)
    this.saveSecureLog({ timestamp, type, data, hash });
  }

  private createHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private saveSecureLog(event: any): void {
    try {
      // Encrypt the log entry
      const encrypted = this.simpleEncrypt(JSON.stringify(event));
      const logKey = 'caro_secure_log';
      const existing = localStorage.getItem(logKey);
      const logs = existing ? JSON.parse(this.simpleDecrypt(existing)) : [];
      logs.push(encrypted);
      
      // Keep only last 100 entries
      if (logs.length > 100) logs.shift();
      
      localStorage.setItem(logKey, this.simpleEncrypt(JSON.stringify(logs)));
    } catch (e) {
      console.error('Error saving secure log:', e);
    }
  }

  private simpleEncrypt(text: string): string {
    // Simple XOR encryption (not cryptographically secure, but prevents casual tampering)
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ this.secretKey.charCodeAt(i % this.secretKey.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result); // Base64 encode
  }

  private simpleDecrypt(encrypted: string): string {
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

  public validateMove(move: { x: number; y: number; player: string }): boolean {
    // Validate move integrity
    if (typeof move.x !== 'number' || typeof move.y !== 'number') {
      this.logEvent('INVALID_MOVE_TYPE', { move });
      return false;
    }

    if (!['X', 'O'].includes(move.player)) {
      this.logEvent('INVALID_PLAYER', { move });
      return false;
    }

    // Check for suspicious patterns (e.g., moves too fast)
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

  public getEventLog(): Array<{ timestamp: number; type: string; data: any; hash: string }> {
    return [...this.eventLog];
  }
}

// Export singleton instance
export const injectionProtection = InjectionProtection.getInstance();

// Export to window for backward compatibility
if (typeof window !== 'undefined') {
  (window as any).InjectionProtection = InjectionProtection;
  (window as any).injectionProtection = injectionProtection;
}






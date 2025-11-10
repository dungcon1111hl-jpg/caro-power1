// Timer Configuration Manager with localStorage persistence
import { CaroConfig } from './config';

export interface TimerConfig {
  matchSeconds: number; // Tổng thời gian mỗi người chơi (600 giây = 10 phút)
  pauseOnOpponentTurn: boolean;
  warningSeconds: number;
}

export class TimerConfigManager {
  private static instance: TimerConfigManager;
  private config: TimerConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): TimerConfigManager {
    if (!TimerConfigManager.instance) {
      TimerConfigManager.instance = new TimerConfigManager();
    }
    return TimerConfigManager.instance;
  }

  public getConfig(): TimerConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<TimerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  public resetToDefault(): void {
    this.config = { ...CaroConfig.DefaultTimerConfig };
    this.saveConfig();
  }

  private loadConfig(): TimerConfig {
    try {
      const stored = localStorage.getItem(CaroConfig.TIMER_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate and merge with defaults
        return {
          matchSeconds: typeof parsed.matchSeconds === 'number' && parsed.matchSeconds > 0 
            ? parsed.matchSeconds 
            : CaroConfig.DefaultTimerConfig.matchSeconds,
          pauseOnOpponentTurn: typeof parsed.pauseOnOpponentTurn === 'boolean' 
            ? parsed.pauseOnOpponentTurn 
            : CaroConfig.DefaultTimerConfig.pauseOnOpponentTurn,
          warningSeconds: typeof parsed.warningSeconds === 'number' && parsed.warningSeconds >= 0 
            ? parsed.warningSeconds 
            : CaroConfig.DefaultTimerConfig.warningSeconds,
        };
      }
    } catch (e) {
      console.error('Error loading timer config:', e);
    }
    return { ...CaroConfig.DefaultTimerConfig };
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(CaroConfig.TIMER_CONFIG_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.error('Error saving timer config:', e);
    }
  }
}

// Export singleton instance
export const timerConfigManager = TimerConfigManager.getInstance();

// Export to window for backward compatibility
if (typeof window !== 'undefined') {
  (window as any).TimerConfigManager = TimerConfigManager;
  (window as any).timerConfigManager = timerConfigManager;
}





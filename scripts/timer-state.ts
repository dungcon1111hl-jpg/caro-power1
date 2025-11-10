// Timer State Manager - Mỗi người chơi có 10 phút riêng
export interface TimerState {
  playerXTimeLeft: number; // Thời gian còn lại của người chơi X (giây)
  playerOTimeLeft: number; // Thời gian còn lại của người chơi O (giây)
  isRunning: boolean;
  currentPlayer: 'X' | 'O';
}

export class TimerStateManager {
  private static instance: TimerStateManager;
  private state: TimerState;
  private timerConfig: any;
  private onTimeUp: (player: 'X' | 'O') => void;

  private constructor() {
    this.state = {
      playerXTimeLeft: 600, // 10 minutes = 600 seconds
      playerOTimeLeft: 600, // 10 minutes = 600 seconds
      isRunning: false,
      currentPlayer: 'X'
    };
  }

  public static getInstance(): TimerStateManager {
    if (!TimerStateManager.instance) {
      TimerStateManager.instance = new TimerStateManager();
    }
    return TimerStateManager.instance;
  }

  public startMatch(config: any, onTimeUp: (player: 'X' | 'O') => void): void {
    this.timerConfig = config;
    this.onTimeUp = onTimeUp;
    const totalTime = config.matchSeconds || 600; // 10 phút mặc định
    this.state = {
      playerXTimeLeft: totalTime,
      playerOTimeLeft: totalTime,
      isRunning: true,
      currentPlayer: 'X'
    };
  }

  public switchTurn(): void {
    this.state.currentPlayer = this.state.currentPlayer === 'X' ? 'O' : 'X';
  }

  public pause(): void {
    this.state.isRunning = false;
  }

  public resume(): void {
    this.state.isRunning = true;
  }

  public tick(): void {
    if (!this.state.isRunning) return;

    // Chỉ đếm ngược thời gian của người chơi hiện tại
    if (this.state.currentPlayer === 'X') {
      this.state.playerXTimeLeft--;
      if (this.state.playerXTimeLeft <= 0) {
        this.state.isRunning = false;
        this.onTimeUp('X'); // Người chơi X hết thời gian → thua
      }
    } else {
      this.state.playerOTimeLeft--;
      if (this.state.playerOTimeLeft <= 0) {
        this.state.isRunning = false;
        this.onTimeUp('O'); // Người chơi O hết thời gian → thua
      }
    }
  }

  public getState(): TimerState {
    return { ...this.state };
  }

  // Lấy thời gian còn lại của người chơi hiện tại
  public getCurrentPlayerTimeLeft(): number {
    return this.state.currentPlayer === 'X' 
      ? this.state.playerXTimeLeft 
      : this.state.playerOTimeLeft;
  }

  // Lấy thời gian còn lại của người chơi cụ thể
  public getPlayerTimeLeft(player: 'X' | 'O'): number {
    return player === 'X' ? this.state.playerXTimeLeft : this.state.playerOTimeLeft;
  }
}
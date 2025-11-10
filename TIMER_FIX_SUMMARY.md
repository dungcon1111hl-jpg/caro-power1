# Sửa lỗi Timer - Mỗi người chơi có 10 phút riêng

## Vấn đề:
- Timer bị reset về 10 phút mỗi khi đến lượt
- Cần mỗi người có tổng 10 phút, đếm ngược từ thời gian còn lại

## Giải pháp đã áp dụng:

### 1. Timer State - Không bao giờ reset
```javascript
const [timerState, setTimerState] = useState(() => {
  // Load từ save nếu có
  if (window.gameSaveManager) {
    const saved = window.gameSaveManager.loadGameState();
    if (saved && saved.timerState) {
      return {
        playerXTimeLeft: saved.timerState.playerXTimeLeft || timerConfig.matchSeconds,
        playerOTimeLeft: saved.timerState.playerOTimeLeft || timerConfig.matchSeconds,
        isRunning: true,
        currentPlayer: saved.current || 'X'
      };
    }
  }
  return {
    playerXTimeLeft: timerConfig.matchSeconds, // 10 phút cho X
    playerOTimeLeft: timerConfig.matchSeconds, // 10 phút cho O
    isRunning: true,
    currentPlayer: 'X'
  };
});
```

### 2. Timer Tick - Sử dụng ref để đọc current mới nhất
```javascript
// Sử dụng ref để luôn đọc giá trị mới nhất của current
const currentRef = useRef(current);
useEffect(() => {
  currentRef.current = current;
}, [current]);

useEffect(() => {
  if (winner || !running) return undefined;
  
  const timerInterval = setInterval(() => {
    setTimerState(prevState => {
      const currentPlayer = currentRef.current; // Đọc từ ref
      
      if (currentPlayer === 'X') {
        const newTime = prevState.playerXTimeLeft - 1; // ✅ Chỉ giảm 1, KHÔNG reset
        if (newTime <= 0) {
          onFinish({ winner: 'O', reason: 'timeout' });
          return { ...prevState, isRunning: false, playerXTimeLeft: 0 };
        }
        return {
          ...prevState,
          playerXTimeLeft: newTime, // ✅ Giữ nguyên giá trị mới
          currentPlayer: 'X'
        };
      } else {
        // Tương tự cho O
      }
    });
  }, 1000);
  
  return () => clearInterval(timerInterval);
}, [current, winner, running]);
```

### 3. End Turn - Không reset timer
```javascript
const endTurn = () => {
  const nextPlayer = current === 'X' ? 'O' : 'X';
  setCurrent(nextPlayer);
  
  // ✅ KHÔNG reset timer - chỉ cập nhật currentPlayer
  setTimerState(prev => ({
    ...prev,
    currentPlayer: nextPlayer
    // KHÔNG reset playerXTimeLeft hoặc playerOTimeLeft
  }));
};
```

### 4. Auto-save - Lưu timer state
```javascript
// Lưu timer state khi auto-save
window.gameSaveManager.saveGameState({
  // ... other data
  timerState: prevTimer // ✅ Lưu timer state
});
```

## Cách hoạt động:

1. **Bắt đầu game:**
   - Mỗi người chơi bắt đầu với 10 phút (600 giây)
   - Timer bắt đầu đếm ngược cho người chơi X

2. **Khi người chơi X đánh:**
   - Thời gian của X tiếp tục đếm ngược (ví dụ: 9:58 → 9:57 → ...)
   - Khi hết lượt, timer dừng đếm cho X
   - Chuyển sang đếm cho O

3. **Khi đến lượt X lại:**
   - Timer tiếp tục đếm ngược từ thời gian còn lại (ví dụ: 9:30 → 9:29 → ...)
   - **KHÔNG reset về 10 phút**

4. **Kết thúc:**
   - Ai hết 10 phút trước → thua
   - Game kết thúc với `reason: 'timeout'`

## Điểm quan trọng:

✅ Timer **KHÔNG BAO GIỜ** reset (trừ khi restart game)
✅ Thời gian được **giữ nguyên** khi chuyển lượt
✅ Timer chỉ **đếm ngược** khi đến lượt người đó
✅ Timer được **lưu** trong auto-save
✅ Sử dụng **ref** để đọc current mới nhất



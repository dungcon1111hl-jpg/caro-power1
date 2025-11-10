# Timer Canvas Component - Tài liệu

## ✅ Tính năng đã triển khai

### 1. Vẽ vòng tròn đếm ngược trên Canvas (HTML5)
- ✅ Sử dụng HTML5 Canvas API
- ✅ `requestAnimationFrame` để cập nhật mượt mà (60fps)
- ✅ High DPI support với `devicePixelRatio`
- ✅ Crisp rendering với `imageRendering: crisp-edges`

### 2. Hiển thị thời gian ở giữa vòng tròn
- ✅ Format: **MM:SS** (phút:giây)
- ✅ Font: Roboto, bold, dễ đọc
- ✅ Màu: Trắng với shadow đen để dễ đọc trên mọi background
- ✅ Text shadow để tăng độ tương phản

### 3. Màu vòng tròn thay đổi theo tiến độ
- ✅ **Xanh lá** (#22c55e): Bình thường (> warningThreshold * 2)
- ✅ **Vàng** (#f59e0b): Cảnh báo (≤ warningThreshold * 2)
- ✅ **Đỏ** (#ef4444): Khẩn cấp (≤ warningThreshold)
- ✅ Chuyển màu mượt mà

### 4. Đồng bộ thời gian
- ✅ Kết nối trực tiếp với `GameTimer` hiện có
- ✅ Timer giảm từng giây và cập nhật vòng tròn
- ✅ **Pause**: Dừng khi đến lượt đối thủ
- ✅ **Resume**: Tiếp tục khi đến lượt mình
- ✅ **Reset**: Reset khi token thay đổi

### 5. Cảnh báo gần hết thời gian
- ✅ **Configurable**: Ngưỡng cảnh báo lấy từ `localStorage` (không hardcode)
- ✅ **Âm thanh beep**: Sử dụng Web Audio API
  - Beep đầu tiên khi đạt ngưỡng
  - Continuous beep mỗi giây khi ≤ warningThreshold
- ✅ **Flash effect**: Vòng tròn nhấp nháy đỏ khi ≤ warningThreshold
  - Alpha animation: `0.3 + 0.2 * sin(timestamp / 100)`
  - Red overlay với lineWidth tăng

### 6. Cấu hình & không hardcode
- ✅ **Thời gian tổng**: Từ `timerConfig.turnSeconds` (localStorage)
- ✅ **Bán kính**: Tự động tính từ `size` (compact/normal)
- ✅ **Màu**: Tự động dựa trên `warningThreshold`
- ✅ **Ngưỡng cảnh báo**: Từ `timerConfig.warningSeconds` (localStorage)
- ✅ **Tất cả config**: Lấy từ `TimerConfigManager` → `localStorage`

### 7. Tích hợp gameplay
- ✅ **Mỗi người chơi có timer riêng**: Component riêng cho X và O
- ✅ **Hiển thị ở góc trái/phải**: Trong Player Info panel
- ✅ **Pause/Resume khi đổi lượt**: 
  - Pause timer người A khi đến lượt người B
  - Resume timer người B khi đến lượt
- ✅ **Đồng bộ với TurnManager**: 
  - `turnToken` để reset timer
  - `running` để control timer state
  - `paused` để pause khi đến lượt đối thủ
- ✅ **Hết giờ → end game**: 
  - `onTimeout` callback được gọi
  - Tự động xác định thua do hết thời gian

## 📐 Canvas Specifications

### Dimensions
- **Normal mode**: 120x120px
- **Compact mode**: 80x80px
- **Radius**: 50px (normal) / 35px (compact)
- **Line width**: 8px (normal) / 6px (compact)

### DPI Scaling
```javascript
const dpr = window.devicePixelRatio || 1;
canvas.width = size * dpr;
canvas.height = size * dpr;
ctx.scale(dpr, dpr);
```

## 🎨 Visual Design

### Color Scheme
1. **Green** (#22c55e): Normal state
2. **Amber** (#f59e0b): Warning state (≤ warningThreshold * 2)
3. **Red** (#ef4444): Urgent state (≤ warningThreshold)

### Flash Effect
- **Trigger**: When `timeLeft <= warningThreshold`
- **Animation**: `alpha = 0.3 + 0.2 * sin(timestamp / 100)`
- **Color**: Red overlay (`rgba(239, 68, 68, alpha)`)
- **Line width**: `lineWidth + 2` for emphasis

## 🔊 Audio Integration

### Beep Sound
- **First beep**: When reaching warning threshold
- **Continuous beep**: Every 1 second when ≤ warningThreshold
- **Frequency**: 800Hz
- **Duration**: 0.1s
- **API**: Web Audio API via `audio.beep()`

## ⚙️ Configuration

### Config Source
```javascript
// From localStorage via TimerConfigManager
{
  turnSeconds: 600,        // Total time (10 minutes default)
  warningSeconds: 60,       // Warning threshold (1 minute default)
  pauseOnOpponentTurn: true // Auto-pause on opponent turn
}
```

### Config Keys
- `caro_timer_config_v1`: Timer configuration in localStorage

## 🔄 Integration with GameScene

### Props
```javascript
<TimerCanvas
  seconds={TURN_SECONDS}                    // From timerConfig
  running={isTurn && running}              // Running when player's turn
  paused={!isTurn && pauseOnOpponentTurn}  // Paused on opponent turn
  token={turnToken}                         // Reset token
  onTimeout={handleTimeout}                 // Timeout callback
  compact={config.compactUI}                // Compact mode
  audio={audio}                             // Audio system
  player={p}                                // Player ('X' or 'O')
  config={config}                           // Game config
/>
```

### Turn Management
- **End turn**: `endTurn()` → `turnToken++` → Timer resets
- **Pause**: When `paused={true}` → Timer stops
- **Resume**: When `paused={false}` → Timer continues
- **Timeout**: `onTimeout()` → `handleTimeout()` → `endTurn()`

## 📱 Responsive

### Compact Mode
- Smaller canvas (80x80px)
- Smaller font (14px)
- Smaller radius (35px)
- Hides player indicator

### Normal Mode
- Larger canvas (120x120px)
- Larger font (18px)
- Larger radius (50px)
- Shows player indicator

## 🎯 Performance

### Optimization
- ✅ `requestAnimationFrame` for smooth 60fps updates
- ✅ Canvas clearing only when needed
- ✅ DPI scaling for crisp rendering
- ✅ Efficient color calculations
- ✅ Cleanup on unmount

### Memory Management
- ✅ Cleanup `requestAnimationFrame` on unmount
- ✅ Clear intervals on timeout/pause
- ✅ Reset refs on token change

## 📝 Usage Example

```javascript
// In GameScene.jsx
{["X", "O"].map((p) => {
  const isTurn = (p === current && !winner);
  return (
    <TimerCanvas
      seconds={TURN_SECONDS}
      running={isTurn && running}
      paused={!isTurn && timerConfig.pauseOnOpponentTurn}
      token={turnToken}
      onTimeout={isTurn ? handleTimeout : undefined}
      compact={config.compactUI}
      audio={audio}
      player={p}
      config={config}
    />
  );
})}
```

## ✅ Tất cả yêu cầu đã hoàn thành!

- ✅ Canvas HTML5 với requestAnimationFrame
- ✅ Hiển thị MM:SS ở giữa vòng tròn
- ✅ Màu xanh → vàng → đỏ
- ✅ Đồng bộ với GameTimer
- ✅ Pause/Resume/Reset
- ✅ Cảnh báo configurable (≤ warningThreshold)
- ✅ Beep sound + flash effect
- ✅ Tất cả config từ localStorage
- ✅ Tích hợp gameplay đầy đủ






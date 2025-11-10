# Tóm tắt Implementation: Timer System & Bot System

## ✅ Đã hoàn thành

### 1. Cơ chế thời gian trận đấu

#### Yêu cầu:
- Mỗi người chơi được cấp tổng thời gian 10 phút (600 giây)
- Thời gian đếm ngược riêng cho từng người — khi người này đánh thì đồng hồ của họ chạy, khi đến lượt đối thủ thì dừng và chuyển sang đếm ngược đối thủ
- Kết thúc trận đấu khi:
  - Một người đánh thua (theo luật game) ✅
  - Một người hết thời gian trước (đồng hồ về 0) → người đó thua ✅
- Không có thời gian tối thiểu (min), chỉ có thời gian tối đa (max = 10 phút / người) ✅

#### Implementation:

**Files đã thay đổi:**
1. `scripts/timer-state.ts` - Thay đổi từ `turnTimeLeft` và `matchTimeLeft` (chung) sang `playerXTimeLeft` và `playerOTimeLeft` (riêng)
2. `scripts/timer-config.ts` - Cập nhật config để chỉ có `matchSeconds` (không còn `turnSeconds`)
3. `scripts/config.ts` - Cập nhật `DefaultTimerConfig` để chỉ có `matchSeconds`
4. `scripts/scenes/GameScene.jsx` - Cập nhật logic timer:
   - Mỗi người chơi bắt đầu với `matchSeconds` (600 giây)
   - Chỉ đếm ngược thời gian của người chơi hiện tại
   - Khi hết thời gian → người đó thua
5. `scripts/components/TimerDisplay.jsx` - Hiển thị thời gian riêng cho từng người chơi
6. `scripts/components/TimerConfigModal.tsx` - Cập nhật UI để cấu hình `matchSeconds` thay vì `turnSeconds`

**Logic chính:**
- Timer chỉ đếm ngược khi `currentPlayer === 'X'` hoặc `currentPlayer === 'O'`
- Khi chuyển lượt, `currentPlayer` thay đổi nhưng thời gian không reset
- Khi một người hết thời gian (≤ 0), game kết thúc với `reason: 'timeout'`

### 2. Bot System (Đối thủ tự động)

#### Yêu cầu:
- Danh sách bot (ví dụ 3 bot mặc định) ✅
- Cơ chế random bot: ví dụ tỉ lệ 30–50% gặp bot ✅
- Có thể chọn độ khó bot: dễ / trung bình / khó (tuỳ cấu hình) ✅
- Find Online Match: nếu không tìm thấy người thật trong X giây → tự động ghép với bot ✅

#### Implementation:

**Files mới:**
1. `scripts/bot-system.js` - Bot system manager:
   - Danh sách 6 bot mặc định (AlphaBot, BetaBot, GammaBot, DeltaBot, EpsilonBot, ZetaBot)
   - Mỗi bot có: id, name, difficulty (Easy/Normal/Hard), elo, avatar
   - Config: `botMatchProbability` (40% mặc định), `matchTimeoutSeconds` (15 giây)
   - Functions:
     - `getRandomBot(difficulty)` - Lấy bot ngẫu nhiên theo độ khó
     - `shouldMatchWithBot()` - Quyết định có nên ghép bot không (dựa trên tỉ lệ)
     - `createBotOpponent(difficulty)` - Tạo bot opponent object

**Files đã thay đổi:**
1. `scripts/scenes/MatchmakingScene.jsx`:
   - Sử dụng `BotSystem.shouldMatchWithBot()` để quyết định ghép bot ngay lập tức (30-50%)
   - Nếu không ghép bot ngay, đợi `matchTimeoutSeconds` (15 giây) rồi tự động ghép bot
   - Hiển thị thông tin bot system trong UI
2. `scripts/scenes/GameScene.jsx`:
   - Hiển thị tên bot khi đối thủ là bot
   - Xử lý bot như AI opponent
3. `index.html` - Thêm script `bot-system.js`

**Cấu hình Bot:**
```javascript
window.BotSystem.config = {
  botMatchProbability: 0.4, // 40% tỉ lệ gặp bot
  matchTimeoutSeconds: 15,  // 15 giây timeout
  defaultDifficulty: 'Normal'
};
```

**Danh sách Bot:**
- Easy: AlphaBot, DeltaBot
- Normal: BetaBot, EpsilonBot
- Hard: GammaBot, ZetaBot

## 📝 Cách sử dụng

### Timer Configuration:
1. Vào game → Menu → ⏱️ Timer Config
2. Cấu hình `matchSeconds` (thời gian mỗi người chơi)
3. Mặc định: 10 phút (600 giây)

### Bot System:
1. Vào Lobby → 🌐 Find Online Match
2. Hệ thống sẽ:
   - 40% khả năng ghép bot ngay lập tức
   - Nếu không, đợi 15 giây rồi tự động ghép bot
3. Bot sẽ có độ khó ngẫu nhiên (Easy/Normal/Hard)

## 🔧 Có thể tùy chỉnh

### Thay đổi tỉ lệ gặp bot:
```javascript
window.BotSystem.updateConfig({ botMatchProbability: 0.5 }); // 50%
```

### Thay đổi timeout:
```javascript
window.BotSystem.updateConfig({ matchTimeoutSeconds: 20 }); // 20 giây
```

### Thêm bot mới:
Chỉnh sửa `scripts/bot-system.js`:
```javascript
BOTS: [
  // ... existing bots
  { id: 'bot_7', name: 'NewBot', difficulty: 'Hard', elo: 1800, avatar: '🤖' }
]
```

## ✅ Testing Checklist

- [x] Timer đếm ngược riêng cho từng người chơi
- [x] Timer chỉ chạy khi đến lượt người chơi đó
- [x] Game kết thúc khi một người hết thời gian
- [x] Bot system hoạt động với tỉ lệ 30-50%
- [x] Tự động ghép bot sau X giây nếu không tìm thấy người chơi
- [x] Bot có độ khó ngẫu nhiên
- [x] Hiển thị tên bot trong game
- [x] Timer config modal hoạt động đúng

## 🐛 Known Issues / Notes

- Timer state không được lưu trong game save (sẽ reset khi load game)
- Bot system chỉ hoạt động khi `window.BotSystem` được load (đã thêm vào index.html)



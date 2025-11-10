# Caro Power - Enhanced Edition

Game Caro với các tính năng nâng cao:
- ✅ TypeScript support
- ✅ HTML5 Sprite Sheet system
- ✅ Timer configuration (không hardcode)
- ✅ Pause/Resume timer functionality
- ✅ Injection protection

## Cài đặt

### Option 1: Sử dụng trực tiếp (hiện tại)
Mở `index.html` trong trình duyệt. Các file TypeScript được load như module.

### Option 2: Build với TypeScript (khuyến nghị)
```bash
npm install
npm run build
```

Sau đó mở `index.html` trong trình duyệt.

## Tính năng mới

### 1. Timer Configuration (Không Hardcode)
- Thời gian mỗi lượt có thể cấu hình (mặc định: 10 phút)
- Lưu cấu hình trong localStorage
- Có thể thay đổi trong game qua menu "⏱️ Timer Config"
- Hỗ trợ pause khi đến lượt đối thủ

### 2. Sprite Sheet System
- Hệ thống sprite sheet sử dụng HTML5 Canvas
- Tự động tạo sprite mặc định nếu không có file
- Component `PieceWithSprite` để sử dụng sprite

### 3. Injection Protection
- Bảo vệ chống inject/bot
- Validate moves
- Log events được mã hóa
- Phát hiện DevTools

### 4. TypeScript
- Các file core đã chuyển sang TypeScript
- Type safety cho config và timer
- Dễ dàng mở rộng

## Cấu trúc File

```
scripts/
├── config.ts              # Configuration với TypeScript
├── timer-config.ts         # Timer configuration manager
├── sprite-sheet.ts         # Sprite sheet system
├── injection-protection.ts # Injection protection
├── components/
│   ├── TimerRing.tsx      # Timer với pause/resume
│   ├── TimerConfigModal.tsx # UI cấu hình timer
│   └── PieceWithSprite.tsx # Piece với sprite support
└── scenes/
    └── GameScene.jsx       # Đã tích hợp timer config và protection
```

## Sử dụng Timer Configuration

1. Trong game, click menu (☰)
2. Chọn "⏱️ Timer Config"
3. Điều chỉnh:
   - **Time per Turn**: Thời gian mỗi lượt (format: MM:SS hoặc số phút)
   - **Warning Time**: Thời gian cảnh báo trước khi hết giờ
   - **Pause on Opponent Turn**: Tự động pause khi đến lượt đối thủ
4. Click "Save"

Cấu hình được lưu tự động trong localStorage với key `caro_timer_config_v1`.

## Sprite Sheet

Để sử dụng sprite sheet:
1. Đặt file sprite tại `assets/sprites.png`
2. Format: 2x2 grid (X normal, X highlight, O normal, O highlight)
3. Mỗi sprite: 64x64 pixels

Nếu không có file, hệ thống sẽ tự động tạo sprite mặc định.

## Injection Protection

Hệ thống tự động:
- Validate mọi move
- Log events được mã hóa
- Phát hiện suspicious activity
- Block invalid moves

Events được lưu trong localStorage với key `caro_secure_log` (đã mã hóa).

## Development

```bash
# Watch mode
npm run watch

# Build
npm run build

# Dev server
npm run dev
```

## Notes

- Timer mặc định: 10 phút (600 giây) - có thể thay đổi
- Timer tự động pause khi đến lượt đối thủ (nếu enabled)
- Injection protection hoạt động tự động, không cần cấu hình





"# cocaro" 

// HTML5 Sprite Sheet System (JavaScript version for Babel)
window.SpriteSheet = class {
  constructor(config) {
    this.config = config;
    this.image = null;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.loaded = false;
    this.load();
  }

  async load() {
    return new Promise((resolve, reject) => {
      this.image = new Image();
      this.image.onload = () => {
        this.loaded = true;
        resolve();
      };
      this.image.onerror = () => {
        this.createDefaultSpriteSheet();
        this.loaded = true;
        resolve();
      };
      this.image.src = this.config.imagePath;
    });
  }

  createDefaultSpriteSheet() {
    const totalWidth = this.config.spriteWidth * this.config.spritesPerRow;
    const totalHeight = this.config.spriteHeight * this.config.spritesPerCol;
    
    this.canvas.width = totalWidth;
    this.canvas.height = totalHeight;
    
    for (let row = 0; row < this.config.spritesPerCol; row++) {
      for (let col = 0; col < this.config.spritesPerRow; col++) {
        const x = col * this.config.spriteWidth;
        const y = row * this.config.spriteHeight;
        
        this.ctx.save();
        this.ctx.translate(x + this.config.spriteWidth / 2, y + this.config.spriteHeight / 2);
        
        if (row === 0) {
          // Draw X sprite
          this.ctx.strokeStyle = '#2f7df4';
          this.ctx.lineWidth = 8;
          this.ctx.lineCap = 'round';
          this.ctx.beginPath();
          this.ctx.moveTo(-this.config.spriteWidth * 0.3, -this.config.spriteHeight * 0.3);
          this.ctx.lineTo(this.config.spriteWidth * 0.3, this.config.spriteHeight * 0.3);
          this.ctx.moveTo(this.config.spriteWidth * 0.3, -this.config.spriteHeight * 0.3);
          this.ctx.lineTo(-this.config.spriteWidth * 0.3, this.config.spriteHeight * 0.3);
          this.ctx.stroke();
        } else {
          // Draw O sprite
          this.ctx.strokeStyle = '#ff8a3c';
          this.ctx.lineWidth = 8;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, this.config.spriteWidth * 0.25, 0, Math.PI * 2);
          this.ctx.stroke();
        }
        
        this.ctx.restore();
      }
    }
  }

  async getSprite(row, col) {
    if (!this.loaded) {
      await this.load();
    }

    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = this.config.spriteWidth;
    spriteCanvas.height = this.config.spriteHeight;
    const spriteCtx = spriteCanvas.getContext('2d');

    const sourceX = col * this.config.spriteWidth;
    const sourceY = row * this.config.spriteHeight;

    if (this.image && this.image.complete) {
      spriteCtx.drawImage(
        this.image,
        sourceX, sourceY, this.config.spriteWidth, this.config.spriteHeight,
        0, 0, this.config.spriteWidth, this.config.spriteHeight
      );
    } else {
      spriteCtx.drawImage(
        this.canvas,
        sourceX, sourceY, this.config.spriteWidth, this.config.spriteHeight,
        0, 0, this.config.spriteWidth, this.config.spriteHeight
      );
    }

    return spriteCanvas;
  }

  async getSpriteAsDataURL(row, col) {
    const canvas = await this.getSprite(row, col);
    return canvas.toDataURL();
  }

  isLoaded() {
    return this.loaded;
  }
};

window.defaultSpriteSheet = new SpriteSheet({
  imagePath: 'assets/sprites.png',
  spriteWidth: 64,
  spriteHeight: 64,
  spritesPerRow: 2,
  spritesPerCol: 2
});






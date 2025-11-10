// Responsive & DPI Handler - Orientation change, touch optimization, DPI scaling
window.ResponsiveHandler = class {
  constructor() {
    this.orientation = this.detectOrientation();
    this.dpi = window.devicePixelRatio || 1;
    this.isMobile = this.detectMobile();
    this.isTablet = this.detectTablet();
    this.listeners = [];
    
    this.setupListeners();
    this.setupTouchOptimization();
  }

  detectOrientation() {
    if (window.innerHeight > window.innerWidth) {
      return 'portrait';
    }
    return 'landscape';
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
  }

  detectTablet() {
    return /iPad|Android/i.test(navigator.userAgent) && !window.MSStream ||
           (window.innerWidth > 768 && window.innerWidth <= 1024);
  }

  setupListeners() {
    // Orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        const newOrientation = this.detectOrientation();
        if (newOrientation !== this.orientation) {
          this.orientation = newOrientation;
          this.notifyListeners('orientationchange', { orientation: newOrientation });
        }
      }, 100);
    });

    // Resize (for desktop window resize)
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const newOrientation = this.detectOrientation();
        if (newOrientation !== this.orientation) {
          this.orientation = newOrientation;
          this.notifyListeners('orientationchange', { orientation: newOrientation });
        }
        this.notifyListeners('resize', { 
          width: window.innerWidth, 
          height: window.innerHeight,
          dpi: window.devicePixelRatio 
        });
      }, 250);
    });

    // DPI change detection
    let dpiCheckInterval = setInterval(() => {
      const newDpi = window.devicePixelRatio || 1;
      if (newDpi !== this.dpi) {
        this.dpi = newDpi;
        this.notifyListeners('dpichange', { dpi: newDpi });
      }
    }, 1000);
  }

  setupTouchOptimization() {
    // Prevent double-tap zoom on iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });

    // Prevent pull-to-refresh on mobile
    let touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      // Prevent pull-to-refresh when scrolling down from top
      if (touchStartY === 0) return;
      const touchY = e.touches[0].clientY;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop === 0 && touchY > touchStartY) {
        e.preventDefault();
      }
    }, { passive: false });

    // Disable text selection on game board (mobile)
    const style = document.createElement('style');
    style.textContent = `
      .game-board-container {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
    `;
    document.head.appendChild(style);
  }

  // Subscribe to events
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners[event].indexOf(callback);
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
    };
  }

  notifyListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error('Error in responsive handler callback:', e);
        }
      });
    }
  }

  // Get optimal cell size based on device
  getOptimalCellSize() {
    if (this.isMobile) {
      const width = window.innerWidth;
      if (width < 375) return 40; // Small phones
      if (width < 414) return 44; // Medium phones
      return 48; // Large phones
    }
    if (this.isTablet) {
      return 52;
    }
    return 56; // Desktop
  }

  // Get optimal zoom for initial view
  getOptimalZoom(boardWidth, boardHeight, containerWidth, containerHeight) {
    const scaleX = containerWidth / boardWidth;
    const scaleY = containerHeight / boardHeight;
    const optimalScale = Math.min(scaleX, scaleY) * 0.85;
    
    // Clamp based on device
    if (this.isMobile) {
      return Math.max(0.5, Math.min(1.2, optimalScale));
    }
    return Math.max(0.3, Math.min(1.5, optimalScale));
  }

  // Check if device supports high DPI
  isHighDPI() {
    return this.dpi >= 2;
  }

  // Get viewport meta tag content (for dynamic adjustment)
  getViewportContent() {
    if (this.isMobile) {
      return 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';
    }
    return 'width=device-width, initial-scale=1.0';
  }
};

window.responsiveHandler = new ResponsiveHandler();






// Components index
window.Components = {};

// Load all components
function initComponents() {
  // Timer components
  if (window.TimerDisplay) {
    window.Components.TimerDisplay = window.TimerDisplay;
  }
  
  // Game components
  if (window.GameScene) {
    window.Components.GameScene = window.GameScene;
  }

  if (window.TimerRing) {
    window.Components.TimerRing = window.TimerRing;
  }

  if (window.TimerCanvas) {
    window.Components.TimerCanvas = window.TimerCanvas;
  }

  console.log('Components initialized:', Object.keys(window.Components));
}

// Call initialization when window loads
window.addEventListener('load', initComponents);
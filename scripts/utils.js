// Utility Functions
window.CaroUtils = {
  shade(hex, amt) {
    try {
      const n = parseInt(hex.slice(1), 16);
      let r = (n >> 16) + amt;
      let g = ((n >> 8) & 255) + amt;
      let b = (n & 255) + amt;
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));
      return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    } catch {
      return hex;
    }
  },

  clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  },

  woodBG(theme, url) {
    if (theme === 'custom' && url) return `url(${url}) center/256px repeat`;
    if (theme === 'woodLight') return ['linear-gradient(180deg, #c99054 0%, #b77b43 100%)', 'radial-gradient(120% 100% at 20% 0%, rgba(255,255,255,0.05), rgba(0,0,0,0.12))'].join(',');
    if (theme === 'slate') return 'linear-gradient(180deg,#3a3f4b,#272b33)';
    if (theme === 'wood-3d') return 'var(--tw-gradient-stops, var(--tw-bg-wood-3d-pattern))';
    return ['linear-gradient(180deg, #a8733a 0%, #8f5a2a 100%)', 'radial-gradient(120% 100% at 20% 0%, rgba(255,255,255,0.05), rgba(0,0,0,0.15))'].join(',');
  },

  keyOf(x, y) {
    return `${x},${y}`;
  },

  randomName() {
    const first = ['Leo', 'Max', 'Ben', 'Chris', 'Sam', 'Liam', 'Alex', 'Nina', 'Mia', 'Luna', 'Zoe'];
    const last = ['Fox', 'Wolf', 'Bear', 'Hawk', 'Owl', 'Lynx', 'Ray'];
    return first[Math.floor(Math.random() * first.length)] + ' ' + last[Math.floor(Math.random() * last.length)];
  },

  randomAvatar() {
    const faces = ['🧑‍🚀', '🧙‍♂️', '🧛‍♂️', '🧘‍♀️', '🧑‍🍳', '🧑‍🎨', '🧑‍💻', '🦊', '🐻', '🦁', '🐯'];
    return faces[Math.floor(Math.random() * faces.length)];
  }
};
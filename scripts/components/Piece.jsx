// Piece Component (X/O)
window.Piece = function({ owner, color, highlight }) {
  const { useMemo } = React;
  const id = useMemo(() => Math.random().toString(36).slice(2), []);
  const dark = window.CaroUtils.shade(color, -20);
  const light = window.CaroUtils.shade(color, 40);
  
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <radialGradient id={`g-${id}`} cx="30%" cy="30%" r="80%">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
        <filter id={`ds-${id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="6" stdDeviation="3.5" floodColor="rgba(0,0,0,0.55)" />
        </filter>
      </defs>
      
      {owner === 'O' ? (
        <g filter={`url(#ds-${id})`}>
          <circle cx="50" cy="50" r="36" fill={`url(#g-${id})`} stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
          <circle cx="50" cy="50" r="23" fill="#0b1020" />
          <circle cx="50" cy="50" r="23" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="2" />
        </g>
      ) : (
        <g filter={`url(#ds-${id})`}>
          <rect x="22" y="44" width="56" height="12" rx="6" fill={`url(#g-${id})`} transform="rotate(45 50 50)" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
          <rect x="22" y="44" width="56" height="12" rx="6" fill={`url(#g-${id})`} transform="rotate(-45 50 50)" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
          <rect x="22" y="44" width="56" height="12" rx="6" fill="rgba(255,255,255,0.15)" transform="rotate(45 50 50)" />
        </g>
      )}
      
      {highlight && (
        <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(16,185,129,0.8)" strokeWidth="4" />
      )}
    </svg>
  );
};
// Piece Component with Sprite Sheet Support
window.PieceWithSprite = function({ owner, color, highlight, useSprite = false }) {
  const { useState, useEffect } = React;
  const [spriteUrl, setSpriteUrl] = useState(null);

  useEffect(() => {
    if (useSprite && window.defaultSpriteSheet) {
      const row = owner === 'X' ? 0 : 1;
      const col = highlight ? 1 : 0;
      window.defaultSpriteSheet.getSpriteAsDataURL(row, col).then(url => {
        setSpriteUrl(url);
      });
    }
  }, [owner, highlight, useSprite]);

  // Fallback to original SVG if sprite not available
  if (!useSprite || !spriteUrl) {
    return <window.Piece owner={owner} color={color} highlight={highlight} />;
  }

  return (
    <img 
      src={spriteUrl} 
      alt={owner}
      className="w-full h-full"
      style={{
        filter: highlight ? 'drop-shadow(0 0 8px rgba(16,185,129,0.8))' : 'none'
      }}
    />
  );
};






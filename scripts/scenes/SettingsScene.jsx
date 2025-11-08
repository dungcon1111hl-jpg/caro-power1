// Settings Scene - Redesigned
window.SettingsScene = function({ config, onChange, onBack, isModal = false }) {
  const { useState, useEffect } = React;
  const [c, setC] = useState(config);
  
  useEffect(() => {
    onChange(c);
  }, [c]);

  const commonInput = "w-full bg-slate-900/50 ring-1 ring-white/10 rounded-lg px-4 py-2 mt-1 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-caro-green transition-all";
  const radioLabel = "px-4 py-2 rounded-lg border cursor-pointer transition-all text-sm font-medium";
  const radioLabelActive = "border-caro-green bg-caro-green/20 text-caro-green shadow-lg shadow-caro-green/20";
  const radioLabelIdle = "border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:border-slate-600";

  return (
    <div className={isModal ? 'w-full text-slate-200 rounded-2xl' : 'w-full min-h-screen text-slate-200 flex flex-col scene-container'}>
      {/* Header */}
      <div className={`p-6 flex items-center justify-between ${!isModal && 'border-b border-slate-700/50 bg-slate-900/30'}`}>
        <div>
          <div className="text-3xl font-bold text-white mb-1">⚙️ Settings</div>
          <div className="text-sm text-slate-400">Customize your game experience</div>
        </div>
        <button
          className="px-6 py-3 rounded-lg bg-caro-green hover:bg-green-600 text-white font-semibold transition-all transform hover:scale-105 shadow-lg"
          onClick={onBack}
        >
          {isModal ? '✓ Done' : '← Back'}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid md:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* General Settings */}
          <div className="glass-card p-6 flex flex-col gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                👤 General Settings
              </h3>
              <p className="text-sm text-slate-400 mb-4">Player preferences and UI options</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Player Name</label>
                <input
                  className={commonInput}
                  value={c.username}
                  onChange={(e) => setC({ ...c, username: e.target.value })}
                  placeholder="Enter your name..."
                  maxLength={20}
                />
                <p className="text-xs text-slate-500 mt-1">This name will be displayed in games</p>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded accent-caro-green cursor-pointer" 
                    checked={c.compactUI} 
                    onChange={(e) => setC({ ...c, compactUI: e.target.checked })} 
                  />
                  <div className="flex-1">
                    <span className="text-slate-300 font-medium group-hover:text-white transition-colors">Compact UI</span>
                    <p className="text-xs text-slate-500">Reduce spacing for smaller screens</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded accent-caro-green cursor-pointer" 
                    checked={c.sfxOn} 
                    onChange={(e) => setC({ ...c, sfxOn: e.target.checked })} 
                  />
                  <div className="flex-1">
                    <span className="text-slate-300 font-medium group-hover:text-white transition-colors">Sound Effects</span>
                    <p className="text-xs text-slate-500">Enable game sound effects</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Board Settings */}
          <div className="glass-card p-6 flex flex-col gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                🎨 Board Appearance
              </h3>
              <p className="text-sm text-slate-400 mb-4">Customize board theme and size</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">Board Theme</label>
                <div className="grid grid-cols-2 gap-2">
                  {['wood-3d', 'woodLight', 'slate', 'custom'].map(t => (
                    <label 
                      key={t} 
                      className={`${radioLabel} ${c.boardTheme === t ? radioLabelActive : radioLabelIdle}`}
                    >
                      <input 
                        type="radio" 
                        name="theme" 
                        className="sr-only" 
                        checked={c.boardTheme === t} 
                        onChange={() => setC({ ...c, boardTheme: t })} 
                      />
                      <span className="capitalize">{t === 'wood-3d' ? 'Wood 3D' : t === 'woodLight' ? 'Light Wood' : t}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {c.boardTheme === 'custom' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Custom Image URL</label>
                  <input 
                    className={commonInput} 
                    placeholder="https://example.com/board.jpg" 
                    value={c.customBoardUrl} 
                    onChange={(e) => setC({ ...c, customBoardUrl: e.target.value })} 
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Cell Size: <span className="text-caro-green font-bold">{c.cellSize}px</span>
                </label>
                <input 
                  type="range" 
                  min="44" 
                  max="64" 
                  value={c.cellSize} 
                  onChange={(e) => setC({ ...c, cellSize: +e.target.value })} 
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-caro-green" 
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Small</span>
                  <span>Large</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Piece Colors */}
          <div className="glass-card p-6 flex flex-col gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                🎯 Piece Colors
              </h3>
              <p className="text-sm text-slate-400 mb-4">Customize X and O piece colors</p>
            </div>
            
            <div className="space-y-4">
              {['X', 'O'].map(p => (
                <div key={p} className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-2xl border-2 border-slate-700" style={{color: c.skins[p].primary, backgroundColor: c.skins[p].primary + '20'}}>
                      {p}
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Piece {p} Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={c.skins[p].primary}
                          onChange={(e) => setC({ 
                            ...c, 
                            skins: { 
                              ...c.skins, 
                              [p]: { ...c.skins[p], primary: e.target.value } 
                            } 
                          })}
                          className="w-16 h-10 rounded border-2 border-slate-700 cursor-pointer"
                        />
                        <input
                          className={commonInput + " flex-1"}
                          value={c.skins[p].primary}
                          onChange={(e) => setC({ 
                            ...c, 
                            skins: { 
                              ...c.skins, 
                              [p]: { ...c.skins[p], primary: e.target.value } 
                            } 
                          })}
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Preview */}
          <div className="glass-card p-6 flex flex-col gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                👁️ Preview
              </h3>
              <p className="text-sm text-slate-400 mb-4">See how your board looks</p>
            </div>
            
            <div 
              className="rounded-xl h-64 border-2 border-slate-700 bg-center bg-cover shadow-inner relative overflow-hidden"
              style={{ backgroundImage: window.CaroUtils.woodBG(c.boardTheme, c.customBoardUrl) }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-sm">
                <div className="text-xs text-white/80 space-y-1">
                  <div>Theme: <span className="font-semibold capitalize">{c.boardTheme}</span></div>
                  <div>Cell Size: <span className="font-semibold">{c.cellSize}px</span></div>
                  <div>Board: <span className="font-semibold">Infinite (15x15 base)</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

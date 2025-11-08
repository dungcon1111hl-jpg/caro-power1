// Game Scene - INFINITE BOARD EDITION (WORKING)
window.GameScene = function({ config, onConfigChange, mode, aiStyle, opponent, onExit, onFinish }) {
  const { useState, useEffect, useRef, useMemo } = React;
  const { Skills, Modes, TURN_SECONDS_DEFAULT, ZOOM_MIN, ZOOM_MAX, DIRS, INITIAL_BOARD_SIZE, EXPAND_THRESHOLD, EXPAND_AMOUNT } = window.CaroConfig;
  
  const CELL_SIZE = window.CaroUtils.clamp(config.cellSize, 44, 64);
  const TURN_SECONDS = TURN_SECONDS_DEFAULT;

  // ============ AUDIO SYSTEM ============
  const audio = window.useAudio();
  useEffect(() => audio.setEnabled(config.sfxOn), [config.sfxOn]);

  // ============ SCORES ============
  const [scores, setScores] = useState(() => {
    const s = localStorage.getItem(window.CaroConfig.SCORES_KEY);
    return s ? JSON.parse(s) : { X: 0, O: 0 };
  });
  
  useEffect(() => {
    localStorage.setItem(window.CaroConfig.SCORES_KEY, JSON.stringify(scores));
  }, [scores]);

  // ============ 🌟 INFINITE BOARD BOUNDS (DYNAMIC) ============
  const [bounds, setBounds] = useState(() => {
    const half = Math.floor(INITIAL_BOARD_SIZE / 2);
    return { minX: -half, maxX: half, minY: -half, maxY: half };
  });
  
  // ============ ZOOM & PAN STATES ============
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ 
    dragging: false, 
    startX: 0, 
    startY: 0, 
    baseX: 0, 
    baseY: 0,
    hasMoved: false 
  });
  const touches = useRef(new Map());

  // ============ GAME STATES ============
  const [cells, setCells] = useState(new Map());
  const [current, setCurrent] = useState('X');
  const [moveCount, setMoveCount] = useState(0);
  const [usedSkills, setUsedSkills] = useState({ X: new Set(), O: new Set() });
  const [activeSkill, setActiveSkill] = useState(null);
  const [pendingMoveData, setPendingMoveData] = useState(null);
  const [pendingWin, setPendingWin] = useState(null);
  const [winner, setWinner] = useState(null);
  const [turnToken, setTurnToken] = useState(0);
  const [running, setRunning] = useState(true);
  const [hover, setHover] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const gridW = bounds.maxX - bounds.minX + 1;
  const gridH = bounds.maxY - bounds.minY + 1;

  // ============ 🌟 INFINITE BOARD EXPANSION ============
  const expandBoundsIfNeeded = (x, y) => {
    const threshold = EXPAND_THRESHOLD;
    let needsExpand = false;
    let newBounds = { ...bounds };

    // Kiểm tra 4 hướng
    if (x - bounds.minX < threshold) {
      newBounds.minX -= EXPAND_AMOUNT;
      needsExpand = true;
      console.log('🌟 Expanding LEFT - New minX:', newBounds.minX);
    }
    if (bounds.maxX - x < threshold) {
      newBounds.maxX += EXPAND_AMOUNT;
      needsExpand = true;
      console.log('🌟 Expanding RIGHT - New maxX:', newBounds.maxX);
    }
    if (y - bounds.minY < threshold) {
      newBounds.minY -= EXPAND_AMOUNT;
      needsExpand = true;
      console.log('🌟 Expanding TOP - New minY:', newBounds.minY);
    }
    if (bounds.maxY - y < threshold) {
      newBounds.maxY += EXPAND_AMOUNT;
      needsExpand = true;
      console.log('🌟 Expanding BOTTOM - New maxY:', newBounds.maxY);
    }

    if (needsExpand) {
      setBounds(newBounds);
      const newW = newBounds.maxX - newBounds.minX + 1;
      const newH = newBounds.maxY - newBounds.minY + 1;
      console.log(`📏 Board expanded to ${newW}x${newH}`);
    }
  };

  // ============ CELL OPERATIONS ============
  const getCell = (x, y) => cells.get(window.CaroUtils.keyOf(x, y));
  
  const setCell = (x, y, data) => {
    setCells(prev => {
      const next = new Map(prev);
      const k = window.CaroUtils.keyOf(x, y);
      if (data == null) next.delete(k);
      else next.set(k, { ...(prev.get(k) || {}), ...data });
      return next;
    });
  };
  
  // ============ WIN DETECTION ============
  const countDir = (x, y, dx, dy, owner) => {
    let c = 0, i = 1;
    while (true) {
      const k = window.CaroUtils.keyOf(x + dx * i, y + dy * i);
      const cell = cells.get(k);
      if (cell?.owner === owner) { c++; i++; } else break;
    }
    return c;
  };
  
  const getFiveLineIfAny = (x, y, owner) => {
    for (const [dx, dy] of DIRS) {
      const left = countDir(x, y, -dx, -dy, owner);
      const right = countDir(x, y, dx, dy, owner);
      const len = left + 1 + right;
      if (len >= 5) {
        const startShift = Math.min(left, 4);
        const sx = x - dx * startShift;
        const sy = y - dy * startShift;
        const pos = [];
        for (let i = 0; i < 5; i++) pos.push(window.CaroUtils.keyOf(sx + dx * i, sy + dy * i));
        return pos;
      }
    }
    return null;
  };
  
  const checkAnyFiveFor = (player) => {
    // Không kiểm tra theo bounds nữa - kiểm tra tất cả cells
    for (const [k, cell] of cells) {
      if (cell.owner === player) {
        const [x, y] = k.split(',').map(Number);
        const found = getFiveLineIfAny(x, y, player);
        if (found) return found;
      }
    }
    return null;
  };
  
  const declareWinner = (player, line) => {
    console.log('🏆 WINNER:', player, 'Line:', line);
    setWinner({ player, line });
    setScores(prev => ({ ...prev, [player]: prev[player] + 1 }));
    audio.win();
    setRunning(false);
    
    // Save match history
    const historyKey = 'caro_match_history';
    const existing = localStorage.getItem(historyKey);
    const history = existing ? JSON.parse(existing) : [];
    history.unshift({
      winner: player,
      playerX: playerXName,
      playerO: playerOName,
      mode: mode,
      timestamp: Date.now(),
      moveCount: moveCount,
      betAmount: null // Will be set if in room mode
    });
    // Keep only last 50 matches
    if (history.length > 50) history.pop();
    localStorage.setItem(historyKey, JSON.stringify(history));
    
    onFinish?.(player);
  };
  
  // ============ TURN MANAGEMENT ============
  const endTurn = () => {
    setCurrent(p => p === 'X' ? 'O' : 'X');
    setMoveCount(n => n + 1);
    setTurnToken(t => t + 1);
    setRunning(true);
    setActiveSkill(null);
    setPendingMoveData(null);
    setHover(null);
  };
  
  const handleTimeout = () => {
    audio.timeout();
    endTurn();
  };
  
  // ============ 🌟 PLACE PIECE (WITH AUTO EXPAND) ============
  const applyPlace = (x, y, owner) => {
    const cur = getCell(x, y);
    if (cur?.owner || cur?.locked) return false;
    
    // ✅ MỞ RỘNG BÀN CỜ TỰ ĐỘNG
    expandBoundsIfNeeded(x, y);
    
    setCell(x, y, { owner });
    return true;
  };
  
  // ============ WIN RESOLUTION ============
  const resolveDelayedWinAfterOpponentMove = (lastMoveBy) => {
    if (!pendingWin) return;
    const opp = lastMoveBy;
    const oppLine = checkAnyFiveFor(opp);
    if (oppLine) {
      declareWinner(opp, oppLine);
      setPendingWin(null);
      return;
    }
    const still = checkAnyFiveFor(pendingWin.player);
    if (still) {
      declareWinner(pendingWin.player, still);
    }
    setPendingWin(null);
  };
  
  // ============ CELL CLICK HANDLER ============
  const onCellClick = (x, y, byAI = false) => {
    console.log('🎯 Click at:', x, y, 'Current:', current);
    
    if (winner) return;
    if (mode === Modes.PVE && current === 'O' && !byAI) return;
    
    if (activeSkill) {
      const done = applySkillClickFlow(activeSkill, x, y);
      if (done) endTurn();
      return;
    }
    
    const ok = applyPlace(x, y, current);
    if (!ok) return;
    
    audio.beep();
    const line = getFiveLineIfAny(x, y, current);
    if (line) setPendingWin({ player: current, line });
    
    if (pendingMoveData?.doubleInTurn && pendingMoveData.doubleUser === current) {
      const count = (pendingMoveData.count || 0) + 1;
      if (count < 2) {
        setPendingMoveData({ ...pendingMoveData, count });
        return;
      }
    }
    
    endTurn();
  };
  
  // ============ SKILL SYSTEM ============
  const applySkillClickFlow = (skill, x, y) => {
    const me = current;
    
    switch (skill) {
      case Skills.ERASE: {
        const c = getCell(x, y);
        if (!c?.owner || c.owner === me) return false;
        setCell(x, y, { owner: undefined });
        consumeSkill(me, skill);
        audio.beep(400, 0.05);
        return true;
      }
      
      case Skills.LOCK: {
        const c = getCell(x, y);
        if (c?.owner || c?.locked) return false;
        setCell(x, y, { locked: true });
        consumeSkill(me, skill);
        audio.beep(300, 0.05);
        return true;
      }
      
      case Skills.CONVERT: {
        const c = getCell(x, y);
        if (!c?.owner || c.owner === me) return false;
        setCell(x, y, { owner: me });
        consumeSkill(me, skill);
        audio.beep(520, 0.05);
        return true;
      }
      
      case Skills.MOVE: {
        if (!pendingMoveData) {
          const c = getCell(x, y);
          if (c?.owner !== me) return false;
          setPendingMoveData({ skill: Skills.MOVE, from: { x, y } });
          audio.tick();
          return false;
        } else if (pendingMoveData.skill === Skills.MOVE) {
          const c = getCell(x, y);
          if (c?.owner || c?.locked) return false;
          setCell(pendingMoveData.from.x, pendingMoveData.from.y, { owner: undefined });
          
          // ✅ MỞ RỘNG KHI DI CHUYỂN
          expandBoundsIfNeeded(x, y);
          setCell(x, y, { owner: me });
          
          consumeSkill(me, skill);
          return true;
        }
        return false;
      }
      
      case Skills.DOUBLE: {
        if (pendingMoveData?.doubleInTurn) return false;
        setPendingMoveData({ 
          skill: Skills.DOUBLE, 
          doubleInTurn: true, 
          doubleUser: me, 
          count: 0 
        });
        consumeSkill(me, skill);
        audio.beep(720, 0.05);
        setActiveSkill(null);
        return false;
      }
      
      default:
        return false;
    }
  };
  
  const consumeSkill = (player, skill) => {
    setUsedSkills(prev => {
      const next = { X: new Set(prev.X), O: new Set(prev.O) };
      next[player].add(skill);
      return next;
    });
    setActiveSkill(null);
  };

  // ============ EXIT HANDLERS ============
  
 const handleExitToLobby = () => {
  console.log('🔄 Exiting to Lobby...');
  
  // Clear all game states immediately
  setWinner(null);
  setShowMenu(false);
  setShowSettings(false);
  setShowChat(false);
  setCells(new Map());
  setActiveSkill(null);
  setPendingMoveData(null);
  setPendingWin(null);
  setUsedSkills({ X: new Set(), O: new Set() });
  setCurrent('X');
  setMoveCount(0);
  setRunning(true);
  setHover(null);
  
  // Call parent exit handler immediately
  if (onExit) {
    onExit();
  }
};

  const handleExitRequest = () => {
    if (!winner && moveCount > 0) {
      const forfeitingPlayer = current;
      const winningPlayer = forfeitingPlayer === 'X' ? 'O' : 'X';
      
      if (confirm(`Do you want to forfeit? ${winningPlayer} will win!`)) {
        onFinish?.(winningPlayer);
        setShowMenu(false);
        handleExitToLobby();
      }
    } else {
      handleExitToLobby();
    }
  };

  // ============ EFFECTS ============
  
useEffect(() => {
  if (moveCount === 0) return; // ✅ OK - early return không cần cleanup
  const lastMover = current === 'X' ? 'O' : 'X';
  resolveDelayedWinAfterOpponentMove(lastMover);
}, [moveCount]);

  useEffect(() => {
    let timeoutId;
    if (mode === Modes.PVE && current === 'O' && !winner) {
      setRunning(false);
      timeoutId = setTimeout(() => {
        const move = window.CaroAI.computeAIMove(aiStyle, cells, bounds);
        if (move) {
          onCellClick(move.x, move.y, true);
        } else {
          endTurn();
        }
        setRunning(true);
      }, 420);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [mode, current, winner, aiStyle, cells, bounds]);

  // ============ ZOOM & PAN SYSTEM ============
  const outerRef = useRef(null);
  const containerRef = useRef(null);
  
  const onWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.06 : 0.94;
    zoomAround(e.clientX, e.clientY, factor);
  };
  
  const onPointerDown = (e) => {
    containerRef.current.setPointerCapture?.(e.pointerId);
    touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    if (touches.current.size === 1) {
      dragRef.current = { 
        dragging: true, 
        startX: e.clientX, 
        startY: e.clientY, 
        baseX: pan.x, 
        baseY: pan.y,
        hasMoved: false
      };
      updateHoverFromClient(e.clientX, e.clientY);
    }
  };
  
  const onPointerMove = (e) => {
    const t = touches.current;
    if (!t.has(e.pointerId)) return;
    const prev = t.get(e.pointerId);
    t.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    if (t.size === 2) {
      const arr = [...t.values()];
      const other = arr[0] === t.get(e.pointerId) ? arr[1] : arr[0];
      const prevDist = Math.hypot((prev?.x || 0) - (other?.x || 0), (prev?.y || 0) - (other?.y || 0));
      const currDist = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
      
      if (prevDist > 0) {
        const factor = window.CaroUtils.clamp(currDist / prevDist, 0.85, 1.15);
        const center = { x: (arr[0].x + arr[1].x) / 2, y: (arr[0].y + arr[1].y) / 2 };
        zoomAround(center.x, center.y, factor);
      }
      setHover(null);
    } 
    else if (dragRef.current.dragging) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        dragRef.current.hasMoved = true;
        setPan({ x: dragRef.current.baseX + dx, y: dragRef.current.baseY + dy });
        setHover(null);
      }
    } else {
      updateHoverFromClient(e.clientX, e.clientY);
    }
  };
  
  const onPointerUp = (e) => {
    touches.current.delete(e.pointerId);
    
    if (touches.current.size === 0) {
      setTimeout(() => {
        dragRef.current.dragging = false;
        dragRef.current.hasMoved = false;
      }, 10);
    }
    
    setHover(null);
  };
  
  const onPointerCancel = onPointerUp;
  
  function updateHoverFromClient(cx, cy) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const gx = Math.floor((cx - rect.left - pan.x) / (CELL_SIZE * zoom)) + bounds.minX;
    const gy = Math.floor((cy - rect.top - pan.y) / (CELL_SIZE * zoom)) + bounds.minY;
    setHover({ x: gx, y: gy });
  }
  
  function zoomAround(cx, cy, factor) {
    setZoom(z => {
      const nz = window.CaroUtils.clamp(z * factor, ZOOM_MIN, ZOOM_MAX);
      setPan(p => {
        const worldX = (cx - p.x) / z;
        const worldY = (cy - p.y) / z;
        return { x: cx - worldX * nz, y: cy - worldY * nz };
      });
      return nz;
    });
  }

  // ============ FIT VIEWPORT (RE-FIT WHEN BOARD EXPANDS) ============
  useEffect(() => {
    const t = setTimeout(() => fitToViewport(), 100);
    return () => clearTimeout(t);
  }, [bounds]); // ✅ Re-fit khi bounds thay đổi

  function fitToViewport() {
    const outer = outerRef.current;
    if (!outer) return;
    const rect = outer.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    const boardW = (bounds.maxX - bounds.minX + 1) * CELL_SIZE;
    const boardH = (bounds.maxY - bounds.minY + 1) * CELL_SIZE;
    const target = Math.min(w / boardW, h / boardH) * 0.85;
    const z = window.CaroUtils.clamp(target, ZOOM_MIN, 1.5);
    setZoom(z);
    setPan({ x: (w - boardW * z) / 2, y: (h - boardH * z) / 2 });
  }
  
  const onBoardClick = (e) => {
    if (dragRef.current.hasMoved) {
      return;
    }
    
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const gx = Math.floor((cx - pan.x) / (CELL_SIZE * zoom)) + bounds.minX;
    const gy = Math.floor((cy - pan.y) / (CELL_SIZE * zoom)) + bounds.minY;
    
    // ✅ KHÔNG CẦN KIỂM TRA BOUNDS - INFINITE BOARD
    onCellClick(gx, gy);
  };

  // ============ GRID CELLS (RENDER VISIBLE AREA + BUFFER) ============
  const gridCells = useMemo(() => {
    const cellsToRender = [];
    
    // Render buffer zone để tránh nhấp nháy khi expand
    const bufferSize = 3;
    const startX = bounds.minX - bufferSize;
    const endX = bounds.maxX + bufferSize;
    const startY = bounds.minY - bufferSize;
    const endY = bounds.maxY + bufferSize;
    
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const k = window.CaroUtils.keyOf(x, y);
        const c = cells.get(k);
        cellsToRender.push({ x, y, k, c });
      }
    }
    
    return cellsToRender;
  }, [bounds, cells]);
  
  const winSet = useMemo(() => new Set(winner?.line || []), [winner]);

  const playerXName = config.username || 'Player X';
  const playerOName = mode === Modes.PVE ? `AI (${aiStyle})` : 'Player O';
  
  function restartMatch() {
    setCells(new Map());
    setCurrent('X');
    setUsedSkills({ X: new Set(), O: new Set() });
    setActiveSkill(null);
    setPendingMoveData(null);
    setPendingWin(null);
    setWinner(null);
    setMoveCount(0);
    setTurnToken(t => t + 1);
    setRunning(true);
    setHover(null);
    
    // ✅ RESET VỀ KÍCH THƯỚC BAN ĐẦU
    const half = Math.floor(INITIAL_BOARD_SIZE / 2);
    setBounds({ minX: -half, maxX: half, minY: -half, maxY: half });
    
    setTimeout(() => fitToViewport(), 100);
  }

  // ============ RENDER ============
  console.log(`🎨 Render - Board: ${gridW}x${gridH}, Winner:`, winner);

  return (
    <div className={`in-match w-full min-h-screen text-slate-200 flex flex-col ${config.compactUI ? 'pt-1' : 'pt-2'}`}>
      {/* Header */}
      <div className={`px-3 ${config.compactUI ? 'pb-1' : 'pb-2'} flex items-center justify-between bg-slate-900/50 backdrop-blur-sm border-b border-white/5`}>
        <div className="flex items-center gap-2">
          <button 
            className="px-2 py-1 rounded border border-white/10 bg-slate-800 hover:bg-slate-700 transition-colors text-sm" 
            onClick={() => setShowMenu(true)}
          >
            ☰
          </button>
          <span className="font-bold hidden md:inline text-white">Caro Infinite</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className={`px-3 py-1 rounded border transition-colors text-sm ${
              showChat 
                ? 'border-caro-green bg-caro-green/20 text-caro-green' 
                : 'border-white/10 bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            onClick={() => setShowChat(!showChat)}
          >
            💬 Chat
          </button>
          <div className="text-xs md:text-sm text-slate-400">
            {gridW}x{gridH} | Zoom {Math.round(zoom * 100)}%
          </div>
        </div>
      </div>

      {/* Player Info */}
      <div className={`px-2 md:px-4 grid grid-cols-2 ${config.compactUI ? 'gap-1' : 'gap-2'} ${config.compactUI ? 'py-1' : 'py-2'}`}>
        {["X", "O"].map((p) => {
          const isTurn = (p === current && !winner && !(mode === Modes.PVE && p === 'O'));
          const name = p === 'X' ? playerXName : playerOName;
          return (
            <div 
              key={p} 
              className={`flex items-center gap-2 rounded-xl p-2 bg-slate-800/70 ring-1 ring-white/5 shadow-lg ${isTurn ? 'ring-2 ring-caro-green' : ''}`}
            >
              <div className="relative">
                <window.TimerRing
                  seconds={TURN_SECONDS}
                  running={isTurn && running}
                  token={turnToken}
                  onTimeout={isTurn ? handleTimeout : undefined}
                  compact={config.compactUI}
                  audio={audio}
                />
                <div className="absolute inset-0 rotate-90 flex items-center justify-center">
                  <div className={`rounded-full bg-slate-900 shadow-inner flex items-center justify-center ${config.compactUI ? 'w-8 h-8' : 'w-10 h-10'}`}>
                    <div
                      className="w-full h-full flex items-center justify-center text-lg font-bold"
                      style={{
                        color: config.skins[p].primary,
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                      }}
                    >
                      {p}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col leading-tight flex-1">
                <div className={`font-semibold truncate text-white ${config.compactUI ? 'text-xs' : 'text-sm'}`}>
                  {name}
                </div>
                <div className="text-[10px] text-slate-400 hidden md:block">{config.skins[p].label}</div>
                <div className={`text-[10px] ${current === p ? "text-caro-green" : "text-slate-500"}`}>
                  {current === p ? "Playing..." : "Waiting"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Game Board */}
      <div ref={outerRef} className="relative flex-1 my-2 mx-2 rounded-2xl neon-board-container" style={{ zIndex: 1 }}>
        {/* Zoom Controls */}
        <div className="absolute left-2 top-2 z-10 flex gap-2">
          <button 
            className="px-2 py-1 rounded bg-slate-800/80 border border-white/10 hover:bg-slate-700 transition-colors text-white text-sm" 
            onClick={() => zoomAround(window.innerWidth / 2, window.innerHeight / 2, 1.1)}
          >
            ＋
          </button>
          <button 
            className="px-2 py-1 rounded bg-slate-800/80 border border-white/10 hover:bg-slate-700 transition-colors text-white text-sm" 
            onClick={() => zoomAround(window.innerWidth / 2, window.innerHeight / 2, 1 / 1.1)}
          >
            －
          </button>
          <button 
            className="px-2 py-1 rounded bg-slate-800/80 border border-white/10 hover:bg-slate-700 transition-colors text-white text-sm" 
            onClick={() => fitToViewport()}
          >
            Fit
          </button>
        </div>
        
        {/* Board Container */}
        <div 
          ref={containerRef} 
          className="absolute inset-0 select-none rounded-2xl overflow-hidden cursor-crosshair" 
          style={{ touchAction: 'none' }} 
          onWheel={onWheel} 
          onPointerDown={onPointerDown} 
          onPointerMove={onPointerMove} 
          onPointerUp={onPointerUp} 
          onPointerCancel={onPointerCancel} 
          onClick={onBoardClick}
        >
          <div 
            className="absolute" 
            style={{ 
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
              transformOrigin: '0 0', 
              left: 0, 
              top: 0, 
              width: gridW * CELL_SIZE, 
              height: gridH * CELL_SIZE, 
              background: window.CaroUtils.woodBG(config.boardTheme, config.customBoardUrl), 
              borderRadius: 16, 
              boxShadow: '0 35px 90px rgba(0,0,0,0.35)' 
            }}
          >
            {/* Grid Lines */}
            <svg width={gridW * CELL_SIZE} height={gridH * CELL_SIZE} className="absolute inset-0 pointer-events-none">
              {Array.from({ length: gridW + 1 }).map((_, i) => (
                <line
                  key={`v${i}`}
                  x1={i * CELL_SIZE} y1={0}
                  x2={i * CELL_SIZE} y2={gridH * CELL_SIZE}
                  stroke={config.boardTheme.includes('wood') ? "#f5deb3" : "#ffffff55"} 
                  strokeWidth="1.5"
                />
              ))}
              {Array.from({ length: gridH + 1 }).map((_, i) => (
                <line
                  key={`h${i}`}
                  x1={0} y1={i * CELL_SIZE}
                  x2={gridW * CELL_SIZE} y2={i * CELL_SIZE}
                  stroke={config.boardTheme.includes('wood') ? "#f5deb3" : "#ffffff55"}
                  strokeWidth="1.5"
                />
              ))}
            </svg>
            
            {/* Hover Indicator */}
            {hover && !getCell(hover.x, hover.y)?.owner && !getCell(hover.x, hover.y)?.locked && (
              <div 
                style={{ 
                  left: (hover.x - bounds.minX) * CELL_SIZE, 
                  top: (hover.y - bounds.minY) * CELL_SIZE, 
                  width: CELL_SIZE, 
                  height: CELL_SIZE 
                }} 
                className="absolute pointer-events-none"
              >
                <div className="absolute inset-1 rounded ring-2 ring-caro-green/55"></div>
              </div>
            )}
            
            {/* Game Pieces */}
            {gridCells.map(({ x, y, k, c }) => {
              const px = (x - bounds.minX) * CELL_SIZE;
              const py = (y - bounds.minY) * CELL_SIZE;
              const isWin = winSet.has(k);
              return (
                <div 
                  key={`cell-${k}`} 
                  style={{ left: px, top: py, width: CELL_SIZE, height: CELL_SIZE }} 
                  className="absolute pointer-events-none"
                >
                  {c?.locked && (
                    <div className="absolute inset-0 flex items-center justify-center text-yellow-400/90 text-xl pointer-events-none">
                      🔒
                    </div>
                  )}
                  {c?.owner && (
                    <div className="absolute inset-0 p-1 select-none pointer-events-none">
                      <window.Piece 
                        owner={c.owner} 
                        color={c.owner === 'X' ? config.skins.X.primary : config.skins.O.primary} 
                        highlight={isWin} 
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Winner Modal */}
      {winner && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="glass-card px-8 py-6 text-center shadow-2xl max-w-md mx-4"
            style={{
              animation: 'bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-5xl mb-4">🎉</div>
            <div 
              className="text-4xl font-bold text-white mb-2" 
              style={{ 
                color: winner.player === 'X' ? config.skins.X.primary : config.skins.O.primary,
                textShadow: '0 0 20px currentColor'
              }}
            >
              {winner.player} Wins!
            </div>
            <div className="text-lg text-slate-300 mb-6">
              5 in a row confirmed! 🏆
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                className="px-6 py-3 rounded-lg bg-caro-green hover:bg-green-600 text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg" 
                onClick={(e) => {
                  e.stopPropagation();
                  restartMatch();
                }}
              >
                🎮 Play Again
              </button>
              <button 
                className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleExitToLobby();
                }}
              >
                🏠 Exit to Lobby
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skills Panel */}
      <div className="mx-2 mb-2 rounded-2xl bg-slate-800/70 ring-1 ring-white/5 p-3">
        <div className="text-xs text-slate-400 mb-1">
          Skills — one use each {activeSkill === Skills.ERASE && <span className="text-yellow-300">(opponent only)</span>}
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {window.CaroConfig.SKILL_LIST.map((s) => {
            const used = usedSkills[current].has(s);
            return (
              <button
                key={s}
                onClick={() => {
                  if (!winner && !used) setActiveSkill(a => a === s ? null : s);
                }}
                disabled={used || (mode === Modes.PVE && current === 'O')}
                className={`relative rounded-xl p-2 pb-5 flex flex-col items-center justify-center flex-shrink-0 w-16 h-16 transition-all ${
                  used 
                    ? 'opacity-40 cursor-not-allowed bg-slate-900/70' 
                    : activeSkill === s 
                    ? 'bg-caro-green text-white' 
                    : 'bg-slate-900/70 hover:bg-slate-700'
                }`}
              >
                {skillIcon(s)}
                {used && <div className="absolute inset-0 bg-black/40 rounded-xl"></div>}
              </button>
            );
          })}
        </div>
        {activeSkill && (
          <div className="mt-2 text-[11px] text-slate-300">
            Active: <b>{activeSkill}</b>
          </div>
        )}
      </div>

      {/* Menu Modal */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <div className="glass-card p-5 w-full max-w-md shadow-2xl">
            <div className="text-xl font-bold mb-3 text-white">Menu</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <button 
                className="rounded-xl bg-slate-700 hover:bg-slate-600 py-2 text-white font-medium transition-colors" 
                onClick={() => setShowMenu(false)}
              >
                Resume
              </button>
              <button 
                className="rounded-xl bg-red-800 hover:bg-red-700 py-2 text-white font-medium transition-colors" 
                onClick={handleExitRequest}
              >
                Exit (Forfeit)
              </button>
              <button 
                className="rounded-xl bg-slate-700 hover:bg-slate-600 py-2 text-white font-medium transition-colors" 
                onClick={() => {
                  setShowMenu(false);
                  setShowSettings(true);
                }}
              >
                Settings
              </button>
              <button 
                className="rounded-xl bg-slate-700 hover:bg-slate-600 py-2 text-white font-medium transition-colors" 
                onClick={() => onConfigChange({ ...config, compactUI: !config.compactUI })}
              >
                Toggle UI
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl shadow-2xl bg-slate-900 ring-1 ring-white/10">
            <window.SettingsScene 
              config={config} 
              onChange={onConfigChange}
              onBack={() => setShowSettings(false)}
              isModal={true}
            />
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {window.ChatPanel && (
        <window.ChatPanel
          config={config}
          mode={mode}
          opponent={opponent || (mode === Modes.ONLINE ? { name: playerOName, id: 'opponent' } : null)}
          onClose={() => setShowChat(false)}
          isOpen={showChat}
        />
      )}

    </div>
  );
  
  // ============ SKILL ICONS ============
  function skillIcon(s) {
    const iconStyle = "w-8 h-8 text-white mb-0.5";
    const labelStyle = "text-[10px] font-semibold tracking-wide absolute bottom-1";

    switch (s) {
      case Skills.ERASE:
        return (<>
          <svg className={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
          <span className={labelStyle}>Erase</span>
        </>);
      case Skills.DOUBLE:
        return (<>
          <span className="text-3xl font-bold leading-none mb-1">x2</span>
          <span className={labelStyle}>Double</span>
        </>);
      case Skills.LOCK:
        return (<>
          <svg className={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span className={labelStyle}>Lock</span>
        </>);
      case Skills.CONVERT:
        return (<>
          <svg className={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8"></polyline>
            <line x1="4" y1="20" x2="21" y2="3"></line>
            <polyline points="8 21 3 21 3 16"></polyline>
            <line x1="3" y1="8" x2="20" y2="21"></line>
          </svg>
          <span className={labelStyle}>Convert</span>
        </>);
      case Skills.MOVE:
        return (<>
          <svg className={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="5 9 2 12 5 15"></polyline>
            <polyline points="9 5 12 2 15 5"></polyline>
            <polyline points="15 19 12 22 9 19"></polyline>
            <polyline points="19 9 22 12 19 15"></polyline>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <line x1="12" y1="2" x2="12" y2="22"></line>
          </svg>
          <span className={labelStyle}>Move</span>
        </>);
      default:
        return '✨';
    }
  }
};  
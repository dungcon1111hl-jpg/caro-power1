// Game Scene - INFINITE BOARD EDITION (WORKING)
window.GameScene = function({ config, onConfigChange, mode, aiStyle, opponent, onExit, onFinish }) {
  const { useState, useEffect, useRef, useMemo } = React;
  const { Skills, Modes, TURN_SECONDS_DEFAULT, ZOOM_MIN, ZOOM_MAX, DIRS, INITIAL_BOARD_SIZE, EXPAND_THRESHOLD, EXPAND_AMOUNT } = window.CaroConfig;
  
  const CELL_SIZE = window.CaroUtils.clamp(config.cellSize, 44, 64);
  
  // Debug: Log opponent info khi mount
  useEffect(() => {
    console.log('🎮 GameScene mounted with:', {
      mode,
      aiStyle,
      opponent,
      isAIOpponent: mode === Modes.PVE || opponent?.isAI || opponent?.isBot
    });
  }, []);
  
  // ============ TIMER CONFIGURATION - Mỗi người chơi có 10 phút riêng ============
  const [timerConfig, setTimerConfig] = useState(() => {
    if (window.timerConfigManager) {
      return window.timerConfigManager.getConfig();
    }
    return { 
      matchSeconds: 600, // 10 minutes per player
      pauseOnOpponentTurn: true, 
      warningSeconds: 60 
    };
  });
  
  // Timer state: mỗi người chơi có thời gian riêng - KHÔNG BAO GIỜ RESET
  const [timerState, setTimerState] = useState(() => {
    // Load từ save nếu có
    if (window.gameSaveManager) {
      const saved = window.gameSaveManager.loadGameState();
      if (saved && saved.timerState) {
        return {
          playerXTimeLeft: saved.timerState.playerXTimeLeft || timerConfig.matchSeconds,
          playerOTimeLeft: saved.timerState.playerOTimeLeft || timerConfig.matchSeconds,
          isRunning: true,
          currentPlayer: saved.current || 'X'
        };
      }
    }
    return {
      playerXTimeLeft: timerConfig.matchSeconds, // 10 phút cho X - BẮT ĐẦU
      playerOTimeLeft: timerConfig.matchSeconds, // 10 phút cho O - BẮT ĐẦU
      isRunning: true,
      currentPlayer: 'X'
    };
  });

  // Timer tick - Đếm ngược thời gian của người chơi hiện tại
  // Sử dụng ref để luôn đọc giá trị mới nhất (tránh closure cũ)
  const currentRef = useRef(current);
  const winnerRef = useRef(winner);
  const runningRef = useRef(running);
  
  useEffect(() => {
    currentRef.current = current;
  }, [current]);
  
  useEffect(() => {
    winnerRef.current = winner;
  }, [winner]);
  
  useEffect(() => {
    runningRef.current = running;
  }, [running]);
  
  useEffect(() => {
    // Kiểm tra điều kiện ban đầu
    // Timer chỉ chạy khi game đã bắt đầu (moveCount > 0) hoặc đang chơi
    if (winnerRef.current || !runningRef.current) {
      setTimerState(prev => ({ ...prev, isRunning: false }));
      return undefined;
    }
    
    // Bắt đầu timer
    setTimerState(prev => ({ ...prev, isRunning: true }));
    
    const timerInterval = setInterval(() => {
      setTimerState(prevState => {
        // Đọc giá trị mới nhất từ ref
        const currentPlayer = currentRef.current;
        const hasWinner = winnerRef.current;
        const isRunningNow = runningRef.current;
        
        // Kiểm tra lại winner và running
        if (hasWinner || !isRunningNow) {
          return { ...prevState, isRunning: false };
        }
        
        // Chỉ đếm ngược thời gian của người chơi ĐANG ĐẾN LƯỢT
        // KHÔNG BAO GIỜ RESET - chỉ đếm ngược từ giá trị hiện tại
        if (currentPlayer === 'X') {
          const newTime = prevState.playerXTimeLeft - 1;
          if (newTime <= 0) {
            // Người chơi X hết thời gian → thua
            onFinish({ 
              winner: 'O',
              reason: 'timeout'
            });
            return { ...prevState, isRunning: false, playerXTimeLeft: 0 };
          }
          return {
            ...prevState,
            playerXTimeLeft: newTime, // ✅ Giảm 1 giây, KHÔNG reset về 600
            currentPlayer: 'X',
            isRunning: true
          };
        } else {
          const newTime = prevState.playerOTimeLeft - 1;
          if (newTime <= 0) {
            // Người chơi O hết thời gian → thua
            onFinish({ 
              winner: 'X',
              reason: 'timeout'
            });
            return { ...prevState, isRunning: false, playerOTimeLeft: 0 };
          }
          return {
            ...prevState,
            playerOTimeLeft: newTime, // ✅ Giảm 1 giây, KHÔNG reset về 600
            currentPlayer: 'O',
            isRunning: true
          };
        }
      });
    }, 1000);
    
    return () => {
      clearInterval(timerInterval);
    };
  }, [current, winner, running]); // Re-run khi current thay đổi để tạo interval mới

  // Cập nhật config khi thay đổi (chỉ reset nếu game chưa bắt đầu)
  useEffect(() => {
    if (window.timerConfigManager && moveCount === 0 && !winner) {
      const newConfig = window.timerConfigManager.getConfig();
      setTimerConfig(newConfig);
      setTimerState(prev => ({
        ...prev,
        playerXTimeLeft: newConfig.matchSeconds,
        playerOTimeLeft: newConfig.matchSeconds
      }));
    }
  }, [moveCount, winner]);
  
  // Không còn TURN_SECONDS, sử dụng matchSeconds
  const [showTimerConfig, setShowTimerConfig] = useState(false);
  
  // ============ INJECTION PROTECTION ============
  useEffect(() => {
    if (window.injectionProtection) {
      window.injectionProtection.logEvent('GAME_STARTED', { mode, aiStyle });
    }
    return undefined;
  }, []);

  // ============ AUDIO SYSTEM ============
  const audio = window.useAudio();
  useEffect(() => {
    audio.setEnabled(config.sfxOn);
  }, [config.sfxOn]);

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
    if (window.gameSaveManager) {
      const saved = window.gameSaveManager.loadGameState();
      if (saved && saved.bounds) return saved.bounds;
    }
    const half = Math.floor(INITIAL_BOARD_SIZE / 2);
    return { minX: -half, maxX: half, minY: -half, maxY: half };
  });
  
  // ============ ZOOM & PAN STATES ============
  const [zoom, setZoom] = useState(() => {
    if (window.gameSaveManager) {
      const saved = window.gameSaveManager.loadGameState();
      if (saved && saved.zoom) return saved.zoom;
    }
    return 1;
  });
  const [pan, setPan] = useState(() => {
    if (window.gameSaveManager) {
      const saved = window.gameSaveManager.loadGameState();
      if (saved && saved.pan) return saved.pan;
    }
    return { x: 0, y: 0 };
  });
  const dragRef = useRef({ 
    dragging: false, 
    startX: 0, 
    startY: 0, 
    baseX: 0, 
    baseY: 0,
    hasMoved: false 
  });
  const touches = useRef(new Map());

  // ============ GAME SAVE/RESUME SYSTEM ============
  const [showResumeModal, setShowResumeModal] = useState(false);
  const hasResume = window.gameSaveManager && window.gameSaveManager.hasSave();
  
  // Load saved game on mount
  useEffect(() => {
    if (window.gameSaveManager && hasResume && !winner) {
      const saveInfo = window.gameSaveManager.getSaveInfo();
      if (saveInfo && !saveInfo.hasWinner) {
        setShowResumeModal(true);
      }
    }
  }, []);

  // ============ GAME STATES ============
  const [cells, setCells] = useState(() => {
    // Try to load from save
    if (window.gameSaveManager) {
      const saved = window.gameSaveManager.loadGameState();
      if (saved && saved.cells) {
        return saved.cells;
      }
    }
    return new Map();
  });
  const [current, setCurrent] = useState(() => {
    if (window.gameSaveManager) {
      const saved = window.gameSaveManager.loadGameState();
      if (saved && saved.current) {
        // Đồng bộ timer state với current player khi load game
        setTimeout(() => {
          setTimerState(prev => ({
            ...prev,
            currentPlayer: saved.current
          }));
        }, 0);
        return saved.current;
      }
    }
    return 'X';
  });
  const [moveCount, setMoveCount] = useState(() => {
    if (window.gameSaveManager) {
      const saved = window.gameSaveManager.loadGameState();
      if (saved && saved.moveCount) return saved.moveCount;
    }
    return 0;
  });
  const [usedSkills, setUsedSkills] = useState(() => {
    if (window.gameSaveManager) {
      const saved = window.gameSaveManager.loadGameState();
      if (saved && saved.usedSkills) return saved.usedSkills;
    }
    return { X: new Set(), O: new Set() };
  });
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
  
  const declareWinner = (player, line, reason = 'line') => {
    console.log('🏆 WINNER:', player, 'Line:', line, 'Reason:', reason);
    setWinner({ player, line, reason });
    setScores(prev => ({ ...prev, [player]: prev[player] + 1 }));
    audio.win();
    setRunning(false);
    
    // Notify parent about game end with reason
    onFinish?.({ winner: player, reason });
    
    // Clear save when game ends
    if (window.gameSaveManager) {
      window.gameSaveManager.clearSave();
    }
    
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
    const nextPlayer = current === 'X' ? 'O' : 'X';
    setCurrent(nextPlayer);
    setMoveCount(n => n + 1);
    setTurnToken(t => t + 1);
    setRunning(true);
    setActiveSkill(null);
    setPendingMoveData(null);
    setHover(null);
    
    // KHÔNG reset timer - chỉ cập nhật currentPlayer để timer biết đếm cho ai
    // Thời gian của mỗi người được giữ nguyên, chỉ chuyển lượt đếm
    setTimerState(prev => ({
      ...prev,
      currentPlayer: nextPlayer
      // KHÔNG reset playerXTimeLeft hoặc playerOTimeLeft
      // Thời gian sẽ tiếp tục đếm ngược từ giá trị hiện tại
    }));
    
    // Auto-save after each turn - Lưu timer state
    if (window.gameSaveManager && window.gameSaveManager.AUTO_SAVE_ENABLED && !winner) {
      setTimeout(() => {
        // Lấy timer state hiện tại để lưu
        setTimerState(prevTimer => {
          window.gameSaveManager.saveGameState({
            mode,
            aiStyle,
            opponent,
            cells,
            current: nextPlayer, // Next player
            moveCount: moveCount + 1,
            usedSkills,
            activeSkill: null,
            pendingMoveData: null,
            pendingWin,
            winner,
            bounds,
            zoom,
            pan,
            turnToken: turnToken + 1,
            running: true,
            config,
            timerState: prevTimer // ✅ Lưu timer state để không bị mất
          });
          return prevTimer; // Không thay đổi state
        });
      }, 100);
    }
  };
  
  const handleTimeout = () => {
    audio.timeout();
    
    // End game on timeout - the current player loses
    const losingPlayer = current;
    const winningPlayer = losingPlayer === 'X' ? 'O' : 'X';
    declareWinner(winningPlayer, null, 'timeout');
    setRunning(false);
    setTimerState(prev => ({ ...prev, isRunning: false }));
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
    
    // ============ INJECTION PROTECTION ============
    if (window.injectionProtection) {
      const move = { x, y, player: current };
      if (!window.injectionProtection.validateMove(move)) {
        console.warn('Invalid move detected - injection protection blocked');
        return;
      }
    }
    
    if (winner) return;
    // Chặn người chơi đánh khi đến lượt AI/Bot
    const isAIOpponent = mode === Modes.PVE || opponent?.isAI || opponent?.isBot;
    if (isAIOpponent && current === 'O' && !byAI) return;
    
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
  
  // Stop all timers and clear intervals first
  setRunning(false);
  
  // Auto-save before exit (if game is in progress) - Lưu timer state
  if (window.gameSaveManager && !winner && moveCount > 0) {
    setTimerState(prevTimer => {
      window.gameSaveManager.saveGameState({
        mode,
        aiStyle,
        opponent,
        cells,
        current,
        moveCount,
        usedSkills,
        activeSkill,
        pendingMoveData,
        pendingWin,
        winner,
        bounds,
        zoom,
        pan,
        turnToken,
        running: false,
        config,
        timerState: prevTimer // ✅ Lưu timer state
      });
      return prevTimer; // Không thay đổi state
    });
  }
  
  // Clear all game states
  setWinner(null);
  setShowMenu(false);
  setShowSettings(false);
  setShowChat(false);
  setShowTimerConfig(false);
  setShowResumeModal(false);
  setCells(new Map());
  setActiveSkill(null);
  setPendingMoveData(null);
  setPendingWin(null);
  setUsedSkills({ X: new Set(), O: new Set() });
  setCurrent('X');
  setMoveCount(0);
  setHover(null);
  
  // Use setTimeout to ensure state updates complete before unmounting
  setTimeout(() => {
    if (onExit) {
      onExit();
    }
  }, 0);
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
  if (moveCount === 0) {
    return undefined; // Explicit return for early exit
  }
  const lastMover = current === 'X' ? 'O' : 'X';
  resolveDelayedWinAfterOpponentMove(lastMover);
  return undefined;
}, [moveCount]);

  // ============ AI/BOT AUTO PLAY ============
  useEffect(() => {
    let timeoutId = null;
    
    // Kiểm tra nếu đối thủ là AI hoặc Bot
    const isAIOpponent = mode === Modes.PVE || opponent?.isAI || opponent?.isBot;
    
    // Debug log
    if (isAIOpponent && current === 'O') {
      console.log('🤖 AI Turn Check:', {
        mode,
        current,
        isAIOpponent,
        opponent,
        winner: !!winner,
        running,
        hasCaroAI: !!window.CaroAI
      });
    }
    
    if (isAIOpponent && current === 'O' && !winner) {
      // Không cần kiểm tra running - AI luôn có thể đánh khi đến lượt
      setRunning(false);
      
      console.log('🤖 AI will play in 420ms...');
      
      // AI turn - timer tự động chuyển khi endTurn được gọi
      timeoutId = setTimeout(() => {
        // Kiểm tra lại các điều kiện trước khi đánh
        if (winner) {
          console.log('🤖 Game already ended, skipping AI move');
          setRunning(true);
          return;
        }
        
        // Kiểm tra lại current player
        if (current !== 'O') {
          console.log('🤖 Turn changed, skipping AI move');
          setRunning(true);
          return;
        }
        
        // Lấy độ khó AI từ opponent hoặc aiStyle
        const aiDifficulty = opponent?.aiStyle || opponent?.difficulty || aiStyle || 'Normal';
        console.log('🤖 AI difficulty:', aiDifficulty);
        
        if (!window.CaroAI) {
          console.error('🤖 CaroAI not found!');
          endTurn();
          setRunning(true);
          return;
        }
        
        const move = window.CaroAI.computeAIMove(aiDifficulty, cells, bounds);
        console.log('🤖 AI computed move:', move);
        
        if (move && move.x !== undefined && move.y !== undefined) {
          console.log('🤖 AI playing at:', move.x, move.y);
          onCellClick(move.x, move.y, true);
        } else {
          console.log('🤖 No valid move, ending turn');
          endTurn();
        }
        setRunning(true);
      }, 420);
    }
    
    return () => {
      if (timeoutId) {
        console.log('🤖 Cleaning up AI timeout');
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  }, [mode, current, winner, aiStyle, opponent, cells, bounds]);

  // ============ FIT VIEWPORT (RE-FIT WHEN BOARD EXPANDS) ============
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

  // ============ RESPONSIVE HANDLER ============
  useEffect(() => {
    if (!window.responsiveHandler) return undefined;
    
    const unsubscribe = window.responsiveHandler.on('orientationchange', (data) => {
      console.log('📱 Orientation changed:', data.orientation);
      // Re-fit viewport when orientation changes
      setTimeout(() => {
        if (outerRef.current) {
          fitToViewport();
        }
      }, 200);
    });
    
    return unsubscribe;
  }, [bounds]);

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
    const t = setTimeout(() => {
      if (outerRef.current) {
        fitToViewport();
      }
    }, 100);
    return () => {
      if (t) {
        clearTimeout(t);
      }
    };
  }, [bounds]); // ✅ Re-fit khi bounds thay đổi
  
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
  const playerOName = opponent?.isBot 
    ? opponent.name || `Bot (${opponent.difficulty || opponent.aiStyle || 'Normal'})`
    : mode === Modes.PVE 
      ? `AI (${aiStyle})` 
      : opponent?.name || 'Player O';
  
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
    
    // ✅ RESET TIMER - Mỗi người chơi bắt đầu với 10 phút
    setTimerState({
      playerXTimeLeft: timerConfig.matchSeconds,
      playerOTimeLeft: timerConfig.matchSeconds,
      isRunning: true,
      currentPlayer: 'X'
    });
    
    // ✅ RESET VỀ KÍCH THƯỚC BAN ĐẦU
    const half = Math.floor(INITIAL_BOARD_SIZE / 2);
    setBounds({ minX: -half, maxX: half, minY: -half, maxY: half });
    
    setTimeout(() => fitToViewport(), 100);
  }

  // ============ RENDER ============
  console.log(`🎨 Render - Board: ${gridW}x${gridH}, Winner:`, winner);

  return (
    <div className="in-match w-full min-h-screen text-slate-200 flex flex-col bg-gradient-to-b from-slate-900 to-black">
      {/* Timer Display */}
      {window.Components && window.Components.TimerDisplay && (
        <window.Components.TimerDisplay timerState={timerState} config={timerConfig} />
      )}

      {/* Compact Header with Player Info */}
      <div className="px-3 py-2 glass-card mx-2 mt-2 mb-2 border border-white/10">
        {/* Top Row: Menu & Controls */}
        <div className="flex items-center justify-between mb-2">
          <button 
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-slate-500 transition-all text-white text-base hover:scale-105 active:scale-95" 
            onClick={() => setShowMenu(true)}
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <button 
              className={`px-3 py-1.5 rounded-lg border transition-all text-xs font-medium ${
                showChat 
                  ? 'border-caro-green bg-caro-green/20 text-caro-green' 
                  : 'border-slate-600 bg-slate-800/50 hover:bg-slate-700/50 text-white'
              }`}
              onClick={() => setShowChat(!showChat)}
            >
              💬
            </button>
            <div className="px-2 py-1 rounded bg-slate-800/50 border border-slate-600 text-[10px] text-slate-400 font-mono">
              {gridW}×{gridH} | {Math.round(zoom * 100)}%
            </div>
          </div>
        </div>
        
        {/* Player Info Row - Compact */}
        <div className="grid grid-cols-2 gap-2">
          {["X", "O"].map((p) => {
            const isTurn = (p === current && !winner && !(mode === Modes.PVE && p === 'O'));
            const name = p === 'X' ? playerXName : playerOName;
            const timeLeft = p === 'X' ? timerState.playerXTimeLeft : timerState.playerOTimeLeft;
            const playerColor = p === 'X' ? config.skins.X.primary : config.skins.O.primary;
            
            return (
              <div 
                key={p} 
                className={`relative flex items-center gap-2 rounded-lg p-2 border transition-all ${
                  isTurn 
                    ? 'border-caro-green bg-caro-green/10 shadow-md shadow-caro-green/20' 
                    : 'border-white/10 bg-slate-800/30'
                }`}
              >
                {/* Turn Indicator */}
                {isTurn && (
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-caro-green animate-pulse"></div>
                )}
                
                {/* Timer - Smaller */}
                <div className="relative flex-shrink-0">
                  {window.TimerCanvas ? (
                    <window.TimerCanvas
                      seconds={timeLeft}
                      running={isTurn && running && !winner}
                      paused={!isTurn && timerConfig.pauseOnOpponentTurn}
                      token={turnToken}
                      onTimeout={isTurn ? handleTimeout : undefined}
                      compact={true}
                      audio={audio}
                      player={p}
                      config={config}
                    />
                  ) : (
                    <window.TimerRing
                      seconds={timeLeft}
                      running={isTurn && running && !winner}
                      paused={!isTurn && timerConfig.pauseOnOpponentTurn}
                      token={turnToken}
                      onTimeout={isTurn ? handleTimeout : undefined}
                      compact={true}
                      audio={audio}
                      warningSeconds={timerConfig.warningSeconds}
                    />
                  )}
                </div>
                
                {/* Player Info - Compact */}
                <div className="flex flex-col leading-tight flex-1 min-w-0">
                  <div className="font-semibold truncate text-xs" style={{ color: playerColor }}>
                    {name}
                  </div>
                  <div className={`text-[9px] flex items-center gap-1 font-medium ${isTurn ? "text-caro-green" : "text-slate-500"}`}>
                    {isTurn ? (
                      <>
                        <span className="w-1 h-1 rounded-full bg-caro-green animate-pulse"></span>
                        <span>Playing</span>
                      </>
                    ) : (
                      'Waiting'
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Game Board */}
      <div ref={outerRef} className="relative flex-1 mx-2 mb-2 rounded-lg neon-board-container" style={{ zIndex: 1 }}>
        {/* Compact Zoom Controls */}
        <div className="absolute left-2 top-2 z-10 flex gap-1.5 glass-card p-1 border border-white/10">
          <button 
            className="px-2 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-slate-500 transition-all text-white text-xs font-bold hover:scale-110 active:scale-95" 
            onClick={() => zoomAround(window.innerWidth / 2, window.innerHeight / 2, 1.1)}
            title="Zoom In"
          >
            ＋
          </button>
          <button 
            className="px-2 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-slate-500 transition-all text-white text-xs font-bold hover:scale-110 active:scale-95" 
            onClick={() => zoomAround(window.innerWidth / 2, window.innerHeight / 2, 1 / 1.1)}
            title="Zoom Out"
          >
            －
          </button>
          <button 
            className="px-2 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-slate-500 transition-all text-white text-[10px] font-semibold hover:scale-110 active:scale-95" 
            onClick={() => fitToViewport()}
            title="Fit"
          >
            Fit
          </button>
        </div>
        
        {/* Board Container */}
        <div 
          ref={containerRef} 
          className="absolute inset-0 select-none rounded-lg overflow-hidden cursor-crosshair" 
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
            <div className="text-lg text-slate-300 mb-6" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
              5 in a row confirmed! 🏆
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                className="px-6 py-3 rounded-lg bg-caro-green hover:bg-green-600 text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg" 
                onClick={(e) => {
                  e.stopPropagation();
                  restartMatch();
                }}
                style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}
              >
                🎮 Play Again
              </button>
              <button 
                className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleExitToLobby();
                }}
                style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}
              >
                🏠 Exit to Lobby
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Skills Panel */}
      <div className="mx-2 mb-2 glass-card border border-white/10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-white flex items-center gap-2" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
            <span className="text-yellow-400 text-base">⚡</span>
            <span>Skills</span>
            <span className="text-xs text-slate-400 font-normal">(one use each)</span>
          </div>
          {activeSkill && (
            <div className="px-3 py-1 rounded-lg bg-yellow-400/20 border border-yellow-400/50 text-xs text-yellow-400 font-medium" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
              Active: <b className="text-yellow-300">{activeSkill}</b>
            </div>
          )}
        </div>
        
        {/* Skills Grid - Căn giữa, cách đều */}
        <div className="flex justify-center gap-3 overflow-x-auto no-scrollbar pb-1">
          {window.CaroConfig.SKILL_LIST.map((s) => {
            const used = usedSkills[current].has(s);
            const isActive = activeSkill === s;
            const isDisabled = used || (mode === Modes.PVE && current === 'O');
            
            // Tooltip descriptions
            const skillDescriptions = {
              erase: 'Remove an opponent\'s piece',
              double: 'Make 2 moves in one turn',
              lock: 'Lock an empty cell, preventing moves',
              convert: 'Convert opponent\'s piece to yours',
              move: 'Move one of your pieces to another position'
            };
            
            const tooltipText = skillDescriptions[s.toLowerCase()] || s;
            
            return (
              <div key={s} className="relative group flex-shrink-0">
                <button
                  onClick={() => {
                    if (!winner && !used) setActiveSkill(a => a === s ? null : s);
                  }}
                  disabled={isDisabled}
                  className={`
                    skill-button
                    relative w-12 h-12 rounded-xl
                    flex flex-col items-center justify-center
                    transition-all duration-200
                    ${used 
                      ? 'opacity-40 cursor-not-allowed skill-button-used' 
                      : isActive 
                      ? 'skill-button-active' 
                      : 'skill-button-default'
                    }
                  `}
                >
                  {/* Icon */}
                  <div className="flex items-center justify-center mb-1">
                    {skillIcon(s, isActive)}
                  </div>
                  
                  {/* Label */}
                  <span className={`text-[10px] font-medium text-center leading-tight ${
                    isActive ? 'text-yellow-200' : 'text-white'
                  }`} style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
                    {s}
                  </span>
                  
                  {/* Used Overlay */}
                  {used && (
                    <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
                      <span className="text-xl text-slate-400">✕</span>
                    </div>
                  )}
                  
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 animate-pulse shadow-lg shadow-yellow-400/50"></div>
                  )}
                </button>
                
                {/* Tooltip */}
                {!used && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-slate-900/95 border border-yellow-400/30 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-lg" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
                    <div className="font-semibold text-yellow-400 mb-0.5">{s}</div>
                    <div className="text-slate-300">{tooltipText}</div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Skills Panel Styles */}
      <style>{`
        .skill-button {
          background: rgba(30, 41, 59, 0.8);
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        .skill-button-default:hover:not(:disabled) {
          transform: scale(1.1);
          background: rgba(51, 65, 85, 0.9);
          border-color: rgba(255, 193, 7, 0.5);
          box-shadow: 
            0 0 15px rgba(255, 193, 7, 0.4),
            0 4px 12px rgba(0, 0, 0, 0.4);
        }
        
        .skill-button-active {
          background: linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 152, 0, 0.2));
          border: 2px solid rgba(255, 193, 7, 0.8);
          box-shadow: 
            0 0 20px rgba(255, 193, 7, 0.6),
            0 4px 16px rgba(0, 0, 0, 0.4);
          transform: scale(1.05);
        }
        
        .skill-button-used {
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(100, 100, 100, 0.3);
        }
        
        .skill-button:active:not(:disabled) {
          transform: scale(0.95);
        }
        
        /* Scrollbar styling for mobile */
        @media (max-width: 640px) {
          .no-scrollbar::-webkit-scrollbar {
            height: 4px;
          }
          .no-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 2px;
          }
          .no-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 193, 7, 0.3);
            border-radius: 2px;
          }
          .no-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 193, 7, 0.5);
          }
        }
      `}</style>

      {/* Professional Menu Modal */}
      {showMenu && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-30 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMenu(false);
          }}
        >
          <div className="glass-card p-6 w-full max-w-sm shadow-2xl border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>Menu</h2>
              <button
                onClick={() => setShowMenu(false)}
                className="w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600 hover:border-slate-500 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
              >
                ✕
              </button>
            </div>
            
            {/* Menu Buttons - 2 columns evenly spaced */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                className="menu-button menu-button-primary"
                onClick={() => setShowMenu(false)}
                style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}
              >
                <span className="text-base">▶️</span>
                <span>Resume</span>
              </button>
              
              <button 
                className="menu-button menu-button-danger"
                onClick={handleExitRequest}
                style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}
              >
                <span className="text-base">🚪</span>
                <span>Exit</span>
              </button>
              
              <button 
                className="menu-button menu-button-secondary"
                onClick={() => {
                  setShowMenu(false);
                  setShowSettings(true);
                }}
                style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}
              >
                <span className="text-base">⚙️</span>
                <span>Settings</span>
              </button>
              
              <button 
                className="menu-button menu-button-secondary"
                onClick={() => {
                  setShowMenu(false);
                  setShowTimerConfig(true);
                }}
                style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}
              >
                <span className="text-base">⏱️</span>
                <span>Timer</span>
              </button>
              
              <button 
                className="menu-button menu-button-secondary col-span-2"
                onClick={() => {
                  onConfigChange({ ...config, compactUI: !config.compactUI });
                  setShowMenu(false);
                }}
                style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}
              >
                <span className="text-base">🔄</span>
                <span>Toggle UI</span>
              </button>
            </div>
          </div>
          
          {/* Menu Styles */}
          <style>{`
            .menu-button {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
              padding: 1rem 0.75rem;
              border-radius: 0.75rem;
              font-size: 0.875rem;
              font-weight: 500;
              color: white;
              transition: all 0.2s ease;
              border: 1.5px solid transparent;
              background: rgba(51, 65, 85, 0.6);
              min-height: 4rem;
            }
            
            .menu-button-primary {
              background: rgba(59, 130, 246, 0.2);
              border-color: rgba(59, 130, 246, 0.4);
            }
            
            .menu-button-primary:hover {
              background: rgba(59, 130, 246, 0.3);
              border-color: rgba(59, 130, 246, 0.6);
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
            
            .menu-button-danger {
              background: rgba(220, 38, 38, 0.15);
              border-color: rgba(220, 38, 38, 0.3);
            }
            
            .menu-button-danger:hover {
              background: rgba(220, 38, 38, 0.25);
              border-color: rgba(220, 38, 38, 0.5);
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
            }
            
            .menu-button-secondary {
              background: rgba(51, 65, 85, 0.6);
              border-color: rgba(148, 163, 184, 0.2);
            }
            
            .menu-button-secondary:hover {
              background: rgba(71, 85, 105, 0.8);
              border-color: rgba(148, 163, 184, 0.4);
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            
            .menu-button:active {
              transform: translateY(0) scale(0.98);
            }
            
            .menu-button:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
            
            @media (max-width: 640px) {
              .menu-button {
                min-height: 3.5rem;
                padding: 0.875rem 0.5rem;
                font-size: 0.8125rem;
              }
            }
          `}</style>
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

      {/* Timer Configuration Modal */}
      {window.TimerConfigModal && (
        <window.TimerConfigModal
          isOpen={showTimerConfig}
          onClose={() => setShowTimerConfig(false)}
          onSave={(newConfig) => {
            setTimerConfig(newConfig);
            setTurnToken(t => t + 1); // Reset timer with new config
          }}
        />
      )}

      {/* Resume Game Modal */}
      {window.ResumeModal && (
        <window.ResumeModal
          isOpen={showResumeModal}
          onResume={() => {
            setShowResumeModal(false);
            // Game state already loaded in useState initializers
          }}
          onNewGame={() => {
            if (window.gameSaveManager) {
              window.gameSaveManager.clearSave();
            }
            // Reset all states
            setCells(new Map());
            setCurrent('X');
            setMoveCount(0);
            setUsedSkills({ X: new Set(), O: new Set() });
            setActiveSkill(null);
            setPendingMoveData(null);
            setPendingWin(null);
            setWinner(null);
            setTurnToken(0);
            setRunning(true);
            const half = Math.floor(INITIAL_BOARD_SIZE / 2);
            setBounds({ minX: -half, maxX: half, minY: -half, maxY: half });
            setZoom(1);
            setPan({ x: 0, y: 0 });
            setShowResumeModal(false);
            setTimeout(() => fitToViewport(), 100);
          }}
          saveInfo={window.gameSaveManager ? window.gameSaveManager.getSaveInfo() : null}
        />
      )}

    </div>
  );
  
  // ============ SKILL ICONS ============
  function skillIcon(s, isActive = false) {
    const iconColor = isActive ? 'text-yellow-300' : 'text-white';
    const iconSize = "w-6 h-6";
    
    switch (s) {
      case Skills.ERASE:
        return (
          <svg className={`${iconSize} ${iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        );
      case Skills.DOUBLE:
        return (
          <span className={`text-2xl font-bold leading-none ${iconColor}`}>x2</span>
        );
      case Skills.LOCK:
        return (
          <svg className={`${iconSize} ${iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        );
      case Skills.CONVERT:
        return (
          <svg className={`${iconSize} ${iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8"></polyline>
            <line x1="4" y1="20" x2="21" y2="3"></line>
            <polyline points="8 21 3 21 3 16"></polyline>
            <line x1="3" y1="8" x2="20" y2="21"></line>
          </svg>
        );
      case Skills.MOVE:
        return (
          <svg className={`${iconSize} ${iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="5 9 2 12 5 15"></polyline>
            <polyline points="9 5 12 2 15 5"></polyline>
            <polyline points="15 19 12 22 9 19"></polyline>
            <polyline points="19 9 22 12 19 15"></polyline>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <line x1="12" y1="2" x2="12" y2="22"></line>
          </svg>
        );
      default:
        return <span className={`${iconSize} ${iconColor}`}>✨</span>;
    }
  }
};  
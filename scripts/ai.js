// AI Logic
window.CaroAI = {
  computeAIMove(style, cells, bounds) {
    const empties = this.collectCandidateEmpty(cells, bounds);
    if (empties.length === 0) return null;
    if (style === 'Easy') return empties[Math.floor(Math.random() * empties.length)];
    if (style === 'Normal') return this.pickHeuristic(cells, bounds, empties, false);
    return this.pickHeuristic(cells, bounds, empties, true);
  },

  collectCandidateEmpty(cells, bounds) {
    const hasAny = cells.size > 0;
    const around = [];
    
    if (hasAny) {
      const occ = Array.from(cells.entries()).filter(([k, v]) => v.owner);
      const seen = new Set();
      
      for (const [k] of occ) {
        const [x, y] = k.split(',').map(Number);
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx < bounds.minX || xx > bounds.maxX || yy < bounds.minY || yy > bounds.maxY) continue;
            const kk = `${xx},${yy}`;
            if (seen.has(kk)) continue;
            seen.add(kk);
            const c = cells.get(kk);
            if (!c?.owner && !c?.locked) around.push({ x: xx, y: yy });
          }
        }
      }
      return around;
    } else {
      const out = [];
      const cx = Math.floor((bounds.minX + bounds.maxX) / 2);
      const cy = Math.floor((bounds.minY + bounds.maxY) / 2);
      for (let y = cy - 2; y <= cy + 2; y++)
        for (let x = cx - 2; x <= cx + 2; x++)
          out.push({ x, y });
      return out;
    }
  },

  pickHeuristic(cells, bounds, candidates, aggressive) {
    let best = null, bestScore = -1e9;
    for (const pt of candidates) {
      const s = this.scorePoint(cells, pt.x, pt.y, aggressive);
      if (s > bestScore) {
        bestScore = s;
        best = pt;
      }
    }
    return best;
  },

  scorePoint(cells, x, y, aggressive) {
    if (cells.get(`${x},${y}`)?.owner || cells.get(`${x},${y}`)?.locked) return -1e6;
    const test = new Map(cells);
    test.set(`${x},${y}`, { owner: 'O' });
    if (this.anyFiveAt(test, x, y, 'O')) return 2000;
    const block = this.wouldBlockX(cells, x, y);
    let score = 0;
    if (block >= 4) score += 120;
    else if (block === 3) score += 40;
    score += this.extendScore(cells, x, y, 'O');
    if (aggressive) score += this.extendScore(cells, x, y, 'O') * 0.5;
    return score + Math.random() * 0.5;
  },

  anyFiveAt(cells, x, y, owner) {
    for (const [dx, dy] of window.CaroConfig.DIRS) {
      let left = 0, right = 0, i = 1;
      while (cells.get(`${x - dx * i},${y - dy * i}`)?.owner === owner) { left++; i++; }
      i = 1;
      while (cells.get(`${x + dx * i},${y + dy * i}`)?.owner === owner) { right++; i++; }
      if (left + 1 + right >= 5) return true;
    }
    return false;
  },

  wouldBlockX(cells, x, y) {
    let best = 0;
    for (const [dx, dy] of window.CaroConfig.DIRS) {
      let left = 0, right = 0, i = 1;
      while (cells.get(`${x - dx * i},${y - dy * i}`)?.owner === 'X') { left++; i++; }
      i = 1;
      while (cells.get(`${x + dx * i},${y + dy * i}`)?.owner === 'X') { right++; i++; }
      best = Math.max(best, left + right);
    }
    return best;
  },

  extendScore(cells, x, y, owner) {
    let score = 0;
    for (const [dx, dy] of window.CaroConfig.DIRS) {
      let left = 0, right = 0, i = 1;
      while (cells.get(`${x - dx * i},${y - dy * i}`)?.owner === owner) { left++; i++; }
      i = 1;
      while (cells.get(`${x + dx * i},${y + dy * i}`)?.owner === owner) { right++; i++; }
      const len = left + 1 + right;
      if (len >= 4) score += 60;
      else if (len === 3) score += 25;
      else if (len === 2) score += 8;
      else if (len === 1) score += 2;
    }
    return score;
  }
};
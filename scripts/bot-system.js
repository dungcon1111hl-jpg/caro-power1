// Bot System - Quản lý danh sách bot và random bot
window.BotSystem = {
  // Danh sách bot mặc định
  BOTS: [
    { id: 'bot_1', name: 'AlphaBot', difficulty: 'Easy', elo: 800, avatar: '🤖' },
    { id: 'bot_2', name: 'BetaBot', difficulty: 'Normal', elo: 1200, avatar: '🤖' },
    { id: 'bot_3', name: 'GammaBot', difficulty: 'Hard', elo: 1600, avatar: '🤖' },
    { id: 'bot_4', name: 'DeltaBot', difficulty: 'Easy', elo: 900, avatar: '🤖' },
    { id: 'bot_5', name: 'EpsilonBot', difficulty: 'Normal', elo: 1300, avatar: '🤖' },
    { id: 'bot_6', name: 'ZetaBot', difficulty: 'Hard', elo: 1700, avatar: '🤖' }
  ],

  // Cấu hình bot
  config: {
    botMatchProbability: 0.4, // 40% tỉ lệ gặp bot (có thể điều chỉnh 30-50%)
    matchTimeoutSeconds: 15, // Sau 15 giây không tìm thấy người → ghép bot
    defaultDifficulty: 'Normal' // Độ khó mặc định
  },

  // Lấy bot ngẫu nhiên
  getRandomBot(difficulty = null) {
    const targetDifficulty = difficulty || this.config.defaultDifficulty;
    const availableBots = this.BOTS.filter(bot => bot.difficulty === targetDifficulty);
    
    if (availableBots.length === 0) {
      // Fallback: lấy bot bất kỳ
      const randomBot = this.BOTS[Math.floor(Math.random() * this.BOTS.length)];
      return {
        ...randomBot,
        aiStyle: randomBot.difficulty
      };
    }
    
    const randomBot = availableBots[Math.floor(Math.random() * availableBots.length)];
    return {
      ...randomBot,
      aiStyle: randomBot.difficulty
    };
  },

  // Quyết định có nên ghép bot không (dựa trên tỉ lệ)
  shouldMatchWithBot() {
    return Math.random() < this.config.botMatchProbability;
  },

  // Tạo bot opponent object
  createBotOpponent(difficulty = null) {
    const bot = this.getRandomBot(difficulty);
    return {
      id: bot.id,
      name: bot.name,
      elo: bot.elo,
      avatar: bot.avatar,
      isAI: true,
      isBot: true, // Flag để phân biệt bot với AI thông thường
      aiStyle: bot.aiStyle,
      difficulty: bot.difficulty
    };
  },

  // Cập nhật cấu hình
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  },

  // Lấy tất cả bot theo độ khó
  getBotsByDifficulty(difficulty) {
    return this.BOTS.filter(bot => bot.difficulty === difficulty);
  },

  // Lấy bot theo ID
  getBotById(id) {
    return this.BOTS.find(bot => bot.id === id);
  }
};



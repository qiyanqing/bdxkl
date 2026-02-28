// js/data/playerData.js - 玩家数据模块

/**
 * 默认玩家数据
 */
export const defaultPlayerData = {
  basicInfo: {
    playerId: 'player_' + Date.now(),
    nickname: '玩家_' + Math.floor(Math.random() * 10000),
    avatar: 'default_avatar.png',
    level: 1,
    exp: 0,
  },
  resources: {
    gold: 1000,      // 初始金币
    gems: 100,       // 初始钻石
    stamina: 100,    // 体力
    maxStamina: 100,
    lastStaminaTime: Date.now(),
  },
  heroes: {
    owned: ['guan_yu'],  // 已拥有的角色ID
    leader: 'guan_yu',   // 当前队长
  },
  bag: {
    equipment: [],  // 已获得装备
    items: [],      // 道具
  },
  levelProgress: {
    maxLevel: 1,    // 已解锁最大关卡
    levelStars: {}, // 各关卡星级 {1: 3, 2: 2}
  },
};

/**
 * 玩家数据管理类
 */
export class PlayerDataManager {
  constructor() {
    this.data = null;
    this.storageKey = 'playerData';
  }

  /**
   * 加载玩家数据
   */
  load() {
    try {
      const stored = wx.getStorageSync(this.storageKey);
      if (stored) {
        this.data = stored;
        console.log('读取存档成功');
      } else {
        this.data = JSON.parse(JSON.stringify(defaultPlayerData));
        console.log('使用默认玩家数据');
      }
    } catch (e) {
      console.error('读取存档失败，使用默认数据');
      this.data = JSON.parse(JSON.stringify(defaultPlayerData));
    }
    return this.data;
  }

  /**
   * 保存玩家数据
   */
  save() {
    try {
      wx.setStorageSync(this.storageKey, this.data);
      console.log('保存存档成功');
      return true;
    } catch (e) {
      console.error('保存存档失败', e);
      return false;
    }
  }

  /**
   * 更新资源
   */
  updateResource(resourceType, amount) {
    if (this.data.resources[resourceType] !== undefined) {
      this.data.resources[resourceType] += amount;
      this.save();
      return true;
    }
    return false;
  }

  /**
   * 获取资源
   */
  getResource(resourceType) {
    return this.data.resources[resourceType] || 0;
  }

  /**
   * 更新关卡进度
   */
  updateLevelProgress(level, stars) {
    this.data.levelProgress.maxLevel = Math.max(this.data.levelProgress.maxLevel, level);
    const currentStars = this.data.levelProgress.levelStars[level] || 0;
    this.data.levelProgress.levelStars[level] = Math.max(currentStars, stars);
    this.save();
  }

  /**
   * 添加角色
   */
  addHero(heroId) {
    if (!this.data.heroes.owned.includes(heroId)) {
      this.data.heroes.owned.push(heroId);
      this.save();
      return true;
    }
    return false;
  }

  /**
   * 设置队长
   */
  setLeader(heroId) {
    if (this.data.heroes.owned.includes(heroId)) {
      this.data.heroes.leader = heroId;
      this.save();
      return true;
    }
    return false;
  }
}

// 导出单例
export const playerDataManager = new PlayerDataManager();

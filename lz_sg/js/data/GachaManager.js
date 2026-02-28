// js/data/GachaManager.js - 抽卡管理器
import { getRandomCharacter, Rarity, GachaRates, PityConfig } from './gachaPool.js';

/**
 * 抽卡结果
 */
export class GachaResult {
  constructor(character, rarity, isPity = false) {
    this.character = character;
    this.rarity = rarity;
    this.isPity = isPity; // 是否是保底
    this.timestamp = Date.now();
  }
}

/**
 * 抽卡管理器
 */
export class GachaManager {
  constructor() {
    this.storageKey = 'gachaData';
    this.data = this.loadData();
  }

  /**
   * 加载抽卡数据
   */
  loadData() {
    try {
      const stored = wx.getStorageSync(this.storageKey);
      if (stored) {
        return stored;
      }
    } catch (e) {
      console.error('读取抽卡数据失败:', e);
    }

    // 默认数据
    return {
      totalPulls: 0,        // 总抽取次数
      urPityCounter: 0,     // 金卡保底计数
      ssrPityCounter: 0,    // 紫卡保底计数
      lastUrIndex: 0,       // 上次金卡在第几抽
      lastSsrIndex: 0,      // 上次紫卡在第几抽
    };
  }

  /**
   * 保存抽卡数据
   */
  saveData() {
    try {
      wx.setStorageSync(this.storageKey, this.data);
      return true;
    } catch (e) {
      console.error('保存抽卡数据失败:', e);
      return false;
    }
  }

  /**
   * 单次抽卡
   */
  pullOne() {
    this.data.totalPulls++;
    const result = this.pullOneInternal();

    // 更新保底计数
    this.updatePityCounters(result.rarity);

    this.saveData();
    return result;
  }

  /**
   * 内部单次抽卡逻辑
   */
  pullOneInternal() {
    const { urPityCounter, ssrPityCounter } = this.data;

    // 检查金卡保底
    if (urPityCounter >= PityConfig.urPity - 1) {
      return new GachaResult(getRandomCharacter('UR'), Rarity.UR, true);
    }

    // 检查紫卡保底
    if (ssrPityCounter >= PityConfig.ssrPity - 1) {
      return new GachaResult(getRandomCharacter('SSR'), Rarity.SSR, true);
    }

    // 正常随机抽卡
    const random = Math.random();
    let rarity;

    if (random < GachaRates.UR) {
      rarity = Rarity.UR;
    } else if (random < GachaRates.UR + GachaRates.SSR) {
      rarity = Rarity.SSR;
    } else {
      rarity = Rarity.R;
    }

    const character = getRandomCharacter(rarity);
    return new GachaResult(character, rarity, false);
  }

  /**
   * 十连抽
   */
  pullTen() {
    const results = [];

    for (let i = 0; i < 10; i++) {
      const result = this.pullOne();
      results.push(result);
    }

    return results;
  }

  /**
   * 更新保底计数器
   */
  updatePityCounters(pulledRarity) {
    if (pulledRarity === Rarity.UR) {
      this.data.urPityCounter = 0;
      this.data.ssrPityCounter = 0;
      this.data.lastUrIndex = this.data.totalPulls;
    } else if (pulledRarity === Rarity.SSR) {
      this.data.ssrPityCounter = 0;
      this.data.lastSsrIndex = this.data.totalPulls;
    } else {
      // 只有蓝卡，紫卡计数+1
      this.data.ssrPityCounter++;
    }

    // 金卡保底计数每次都+1（除非出了金卡）
    if (pulledRarity !== Rarity.UR) {
      this.data.urPityCounter++;
    }
  }

  /**
   * 获取保底进度信息
   */
  getPityProgress() {
    return {
      urProgress: this.data.urPityCounter,
      urMax: PityConfig.urPity,
      urRemaining: PityConfig.urPity - this.data.urPityCounter,
      ssrProgress: this.data.ssrPityCounter,
      ssrMax: PityConfig.ssrPity,
      ssrRemaining: PityConfig.ssrPity - this.data.ssrPityCounter,
      lastUrIndex: this.data.lastUrIndex,
      lastSsrIndex: this.data.lastSsrIndex,
    };
  }

  /**
   * 重置抽卡数据（测试用）
   */
  resetData() {
    this.data = {
      totalPulls: 0,
      urPityCounter: 0,
      ssrPityCounter: 0,
      lastUrIndex: 0,
      lastSsrIndex: 0,
    };
    this.saveData();
  }
}

// 导出单例
export const gachaManager = new GachaManager();

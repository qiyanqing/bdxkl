// js/map/GridEventSystem.js
export class GridEventSystem {
  constructor(levelState) {
    this.levelState = levelState;
  }

  // 触发格子事件
  async triggerEvent(grid) {
    const { type } = grid;

    // 标记格子已访问
    grid.visited = true;

    switch (type) {
      case 'battle':
        return this.triggerBattle(grid, false);
      case 'elite':
        return this.triggerBattle(grid, true);
      case 'shop':
        return this.triggerShop();
      case 'buff':
        return this.triggerBuff();
      case 'event':
        return this.triggerRandomEvent();
      case 'rest':
        return this.triggerRest();
      case 'dice':
        return this.triggerDiceReward();
      default:
        console.log('未知格子类型:', type);
    }
  }

  // 普通战斗
  async triggerBattle(grid, isElite) {
    console.log(isElite ? '触发精英战斗' : '触发普通战斗');
    // TODO: 跳转到战斗场景
    return { type: 'battle', isElite };
  }

  // 商店
  async triggerShop() {
    console.log('触发商店');
    // TODO: 显示商店面板
    return { type: 'shop' };
  }

  // Buff格
  async triggerBuff() {
    const buffs = ['攻击+20%', '防御+20%', '暴击+15%'];
    const buff = buffs[Math.floor(Math.random() * buffs.length)];
    console.log('获得buff:', buff);
    this.levelState.activeBuffs.push(buff);
    return { type: 'buff', buff };
  }

  // 随机事件
  async triggerRandomEvent() {
    console.log('触发随机事件');
    // TODO: 实现事件系统
    return { type: 'event' };
  }

  // 休息格
  async triggerRest() {
    console.log('触发休息，回复30%血量');
    // TODO: 回复血量
    return { type: 'rest', heal: 0.3 };
  }

  // 骰子奖励
  async triggerDiceReward() {
    const rewards = ['luckyCoins', 'minDice', 'doubleDice'];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    this.levelState.inventory[reward]++;
    console.log('获得骰子道具:', reward);
    return { type: 'dice', reward };
  }
}

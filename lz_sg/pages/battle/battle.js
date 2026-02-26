// pages/battle/battle.js
const Combat = require('../../utils/combat.js');
const { heroes } = require('../../data/characters.js');

Page({
  data: {
    myHeroes: [],
    enemyHeroes: [],
    turn: 0,
    currentAction: '战斗开始！',
    battleResult: null,
    battleResultText: '',
    resultClass: ''
  },

  onLoad() {
    this.initBattle();
  },

  // 初始化战斗
  initBattle() {
    // 初始化我方角色
    const myHeroes = heroes.map(h => ({
      ...h,
      currentHp: h.maxHp,
      currentMp: 0
    }));

    // 初始化敌方角色（复制我方数据作为测试）
    const enemyHeroes = heroes.map(h => ({
      ...h,
      id: h.id + '_enemy',
      name: h.name + '（敌）',
      currentHp: h.maxHp,
      currentMp: 0
    }));

    this.setData({
      myHeroes,
      enemyHeroes,
      turn: 0,
      currentAction: '战斗开始！',
      battleResult: null,
      battleResultText: '',
      resultClass: ''
    });

    // 创建战斗实例
    this.combat = new Combat(myHeroes, enemyHeroes);

    // 绑定UI回调
    this.combat.onAttack = this.onAttack.bind(this);
    this.combat.onSkill = this.onSkill.bind(this);

    // 初始化战斗
    this.combat.init();

    // 开始战斗循环
    setTimeout(() => {
      this.startBattle();
    }, 1000);
  },

  // 战斗主循环
  async startBattle() {
    // 检查战斗是否已结束
    if (this.data.battleResult) {
      return;
    }

    // 执行一回合
    const result = await this.combat.executeTurn();

    // 更新UI
    this.updateUI();

    if (result) {
      // 战斗结束
      this.handleBattleEnd(result);
      return;
    }

    // 延迟后继续下一回合
    setTimeout(() => {
      this.startBattle();
    }, 1500);
  },

  // 更新UI
  updateUI() {
    this.setData({
      myHeroes: this.combat.myHeroes,
      enemyHeroes: this.combat.enemyHeroes,
      turn: this.data.turn + 1
    });
  },

  // 处理战斗结束
  handleBattleEnd(result) {
    const resultText = result === 'win' ? '战斗胜利！' : '战斗失败！';
    const resultClass = result;

    this.setData({
      currentAction: resultText,
      battleResult: result,
      battleResultText: resultText,
      resultClass: resultClass
    });

    console.log('战斗结束，结果:', result);
  },

  // 攻击回调
  async onAttack(attacker, target, damage) {
    const actionText = `${attacker.name} 攻击 ${target.name}，造成 ${damage} 点伤害`;
    this.setData({ currentAction: actionText });
    await this.delay(500);
  },

  // 技能回调
  async onSkill(hero, target, damage) {
    const actionText = `${hero.name} 释放 ${hero.skill.name}！造成 ${damage} 点伤害`;
    this.setData({ currentAction: actionText });
    await this.delay(1000);
  },

  // 重新开始战斗
  restartBattle() {
    this.initBattle();
  },

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
})

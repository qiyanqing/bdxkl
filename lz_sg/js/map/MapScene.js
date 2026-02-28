// js/map/MapScene.js
// 地图场景主类
import { MapGenerator } from './MapGenerator.js';

export class MapScene {
  constructor(canvas, width, height) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = width;
    this.height = height;
    this.isActive = false;

    // 关卡状态
    this.levelState = {
      currentLevel: 1,
      diceUsed: 0,
      diceRemaining: 15,
      playerPosition: 0,
      totalSteps: 0,
      forceBattleCounter: 0,
      activeBuffs: [],
      inventory: {
        luckyCoins: 0,
        minDice: 0,
        doubleDice: 0
      },
      leaderHeroId: 'guan_yu'
    };

    // 地图数据
    this.grids = [];
    this.player = null;
  }

  init() {
    console.log('地图场景初始化');
    this.isActive = true;
    this.loadLevelConfig();
    this.gameLoop();
  }

  loadLevelConfig() {
    const generator = new MapGenerator(null, this.width, this.height);
    this.grids = generator.generate();
    console.log('地图生成完成，格子数:', this.grids.length);
  }

  update() {
    // 动画更新逻辑
    // TODO: 后续添加
  }

  render(ctx = this.ctx) {
    if (!this.isActive) return;

    // 清空画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.width, this.height);
  }

  gameLoop() {
    if (!this.isActive) return;

    this.update();
    this.render(this.ctx);
    requestAnimationFrame(() => this.gameLoop());
  }

  onTouch(x, y) {
    console.log('地图场景点击', x, y);
  }
}

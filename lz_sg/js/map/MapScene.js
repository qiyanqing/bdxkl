// js/map/MapScene.js - 完整版
import { MapGenerator } from './MapGenerator.js';
import { GridRenderer } from './GridRenderer.js';
import { PlayerController } from './PlayerController.js';
import { PlayerRenderer } from './PlayerRenderer.js';
import { GridEventSystem } from './GridEventSystem.js';
import { UIController } from './UIController.js';

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

    // 子系统
    this.gridRenderer = new GridRenderer(this.ctx);
    this.playerController = new PlayerController(this.levelState);
    this.playerRenderer = new PlayerRenderer(this.ctx);
    this.eventSystem = new GridEventSystem(this.levelState);
    this.uiController = new UIController(this.ctx, width, height);
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

    // 绘制所有格子
    this.grids.forEach((grid, index) => {
      const isSelected = index === this.levelState.playerPosition;
      this.gridRenderer.drawGrid(grid, isSelected);
    });

    // 绘制玩家棋子
    const currentGrid = this.grids[this.levelState.playerPosition];
    if (currentGrid) {
      this.playerRenderer.drawPlayer(currentGrid, this.levelState.leaderHeroId);
    }

    // 绘制UI
    this.uiController.drawTopBar(this.levelState);
    this.uiController.drawBottomBar(this.levelState);
  }

  gameLoop() {
    if (!this.isActive) return;

    this.update();
    this.render(this.ctx);
    requestAnimationFrame(() => this.gameLoop());
  }

  onTouch(x, y) {
    // 检查是否点击骰子按钮
    if (this.uiController.checkDiceButtonClick(x, y, this.levelState)) {
      this.rollDice();
    }
  }

  // 骰子投掷
  rollDice() {
    if (this.levelState.diceRemaining <= 0) {
      console.log('没有剩余骰子了');
      this.checkLevelEnd();
      return;
    }

    const diceValue = this.playerController.rollDice();
    console.log('投掷骰子:', diceValue);

    const targetPos = this.playerController.calculateTargetPosition(diceValue);
    this.playerController.moveTo(targetPos);
    this.playerController.updateLevelState(diceValue);

    // 等待移动动画完成后触发事件
    setTimeout(async () => {
      const currentGrid = this.grids[this.levelState.playerPosition];
      const eventResult = await this.eventSystem.triggerEvent(currentGrid);
      this.handleEventResult(eventResult);
    }, 500);
  }

  // 处理事件结果
  handleEventResult(result) {
    console.log('事件结果:', result);

    // 检查是否通关
    if (this.levelState.diceRemaining <= 0) {
      this.checkLevelEnd();
    }
  }

  // 检查关卡结束
  checkLevelEnd() {
    const diceUsed = this.levelState.diceUsed;
    let stars = 0;
    if (diceUsed >= 15) stars = 3;
    else if (diceUsed >= 10) stars = 2;
    else if (diceUsed >= 5) stars = 1;

    console.log('关卡结束！使用骰子:', diceUsed, '星级:', stars);
    // TODO: 显示结算界面
  }
}

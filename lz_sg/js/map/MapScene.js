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

    // 动画相关属性
    this.animation = {
      isAnimating: false,
      currentGridIndex: 0,
      targetGridIndex: 0,
      progress: 0,      // 0到1的进度
      speed: 0.05,      // 移动速度
      moveQueue: [],    // 待移动的格子队列
      totalSteps: 0     // 记录本次移动的总步数
    };
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
    this.updateMoveAnimation();
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

    // 绘制玩家棋子（支持动画）
    let playerGrid = this.grids[this.levelState.playerPosition];

    if (this.animation.isAnimating) {
      // 计算动画位置
      const fromGrid = this.grids[this.animation.currentGridIndex];
      const toGrid = this.grids[this.animation.targetGridIndex];

      // 线性插值
      const x = fromGrid.x + (toGrid.x - fromGrid.x) * this.animation.progress;
      const y = fromGrid.y + (toGrid.y - fromGrid.y) * this.animation.progress;

      // 创建临时格子对象用于渲染
      playerGrid = { ...playerGrid, x, y };
    }

    if (playerGrid) {
      this.playerRenderer.drawPlayer(playerGrid, this.levelState.leaderHeroId);
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
    if (this.levelState.diceRemaining <= 0 || this.animation.isAnimating) {
      if (this.levelState.diceRemaining <= 0) {
        console.log('没有剩余骰子了');
        this.checkLevelEnd();
      }
      return;
    }

    const diceValue = this.playerController.rollDice();
    console.log('投掷骰子:', diceValue);

    const startPos = this.levelState.playerPosition;
    const totalGrids = this.grids.length;

    // 计算移动路径上的所有格子
    this.animation.moveQueue = [];
    for (let i = 1; i <= diceValue; i++) {
      this.animation.moveQueue.push((startPos + i) % totalGrids);
    }

    // 记录总步数
    this.animation.totalSteps = diceValue;

    // 开始动画
    this.startMoveAnimation();
  }

  // 开始移动动画
  startMoveAnimation() {
    if (this.animation.moveQueue.length === 0) {
      // 移动完成，触发事件
      this.triggerGridEvent();
      return;
    }

    this.animation.isAnimating = true;
    this.animation.currentGridIndex = this.levelState.playerPosition;
    this.animation.targetGridIndex = this.animation.moveQueue.shift();
    this.animation.progress = 0;
  }

  // 更新动画状态
  updateMoveAnimation() {
    if (!this.animation.isAnimating) return;

    this.animation.progress += this.animation.speed;

    if (this.animation.progress >= 1) {
      // 当前格子移动完成
      this.levelState.playerPosition = this.animation.targetGridIndex;
      this.animation.progress = 0;

      // 继续下一个格子
      if (this.animation.moveQueue.length > 0) {
        this.animation.currentGridIndex = this.animation.targetGridIndex;
        this.animation.targetGridIndex = this.animation.moveQueue.shift();
      } else {
        // 所有移动完成
        this.animation.isAnimating = false;
        this.playerController.updateLevelState(this.animation.totalSteps);

        // 触发格子事件
        setTimeout(() => {
          this.triggerGridEvent();
        }, 200);
      }
    }
  }

  // 触发格子事件
  async triggerGridEvent() {
    const currentGrid = this.grids[this.levelState.playerPosition];
    const eventResult = await this.eventSystem.triggerEvent(currentGrid);
    this.handleEventResult(eventResult);
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

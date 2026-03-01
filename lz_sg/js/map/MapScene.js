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
      diceRemaining: 20,
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

    // 摄像机系统
    this.camera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0
    };

    // 拖拽相关
    this.drag = {
      isDragging: false,
      startX: 0,
      startY: 0,
      startCameraX: 0,
      startCameraY: 0
    };

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

    // 返回按钮（适配安全区域）
    this.backButton = this.createBackButton();
  }

  /**
   * 创建返回按钮（适配安全区域）
   */
  createBackButton() {
    // 获取安全区域信息
    let topSafePadding = 10;
    try {
      const systemInfo = wx.getSystemInfoSync();
      const safeArea = systemInfo.safeArea || { top: 0 };
      const statusBarHeight = systemInfo.statusBarHeight || 0;
      // 如果是刘海屏/灵动岛，增加顶部间距
      if (safeArea.top > statusBarHeight + 5) {
        topSafePadding = safeArea.top;
      }
    } catch (e) {
      console.error('获取安全区域失败:', e);
    }

    return {
      x: this.width - 70,
      y: topSafePadding,
      width: 60,
      height: 30,
      callback: null,
    };
  }

  init() {
    console.log('地图场景初始化');
    this.isActive = true;
    this.loadLevelConfig();
    this.bindTouchEvents();
    this.gameLoop();
  }

  // 绑定触摸事件
  bindTouchEvents() {
    // 只有在微信小游戏环境中才绑定触摸事件
    if (typeof wx !== 'undefined') {
      // 触摸开始
      wx.onTouchStart((e) => {
        const touch = e.touches[0];
        const x = touch.x || touch.clientX;
        const y = touch.y || touch.clientY;

        // 检查是否点击返回按钮
        if (this.checkBackButtonClick(x, y)) {
          this.handleBackButtonClick();
          return;
        }

        this.drag.isDragging = true;
        this.drag.startX = x;
        this.drag.startY = y;
        this.drag.startCameraX = this.camera.x;
        this.drag.startCameraY = this.camera.y;
      });

      // 触摸移动
      wx.onTouchMove((e) => {
        if (!this.drag.isDragging) return;

        const touch = e.touches[0];
        const currentX = touch.x || touch.clientX;
        const currentY = touch.y || touch.clientY;

        // 计算拖拽偏移量
        const deltaX = currentX - this.drag.startX;
        const deltaY = currentY - this.drag.startY;

        // 更新摄像机位置
        this.camera.x = this.drag.startCameraX - deltaX;
        this.camera.y = this.drag.startCameraY - deltaY;

        // 限制摄像机不超出地图边界
        this.limitCameraBounds();
      });

      // 触摸结束
      wx.onTouchEnd(() => {
        this.drag.isDragging = false;
      });
    }
  }

  // 限制摄像机边界
  limitCameraBounds() {
    const mapWidth = this.config.mapWidth || this.width;
    const mapHeight = this.config.mapHeight || this.height;
    
    // 允许摄像机向左和向上移动，以查看左侧和上方的格子
    this.camera.x = Math.min(this.camera.x, mapWidth - this.width);
    this.camera.y = Math.min(this.camera.y, mapHeight - this.height);
  }

  loadLevelConfig() {
    const generator = new MapGenerator(null, this.width, this.height);
    this.grids = generator.generate();
    // 保存地图配置供摄像机使用
    this.config = generator.config;
    console.log('地图生成完成，格子数:', this.grids.length);
  }

  // 更新摄像机位置（平滑跟随玩家）
  updateCamera() {
    if (this.drag.isDragging) return; // 拖拽时不跟随

    const playerGrid = this.grids[this.levelState.playerPosition];
    if (!playerGrid) return;

    // 目标：玩家在屏幕中心
    this.camera.targetX = playerGrid.x - this.width / 2;
    this.camera.targetY = playerGrid.y - this.height / 2;

    // 限制摄像机不超出地图边界
    const mapWidth = this.grids.length > 0 ? this.config.mapWidth || this.width : this.width;
    const mapHeight = this.grids.length > 0 ? this.config.mapHeight || this.height : this.height;

    // 允许摄像机向左和向上移动，以查看左侧和上方的格子
    this.camera.targetX = Math.min(this.camera.targetX, mapWidth - this.width);
    this.camera.targetY = Math.min(this.camera.targetY, mapHeight - this.height);

    // 平滑移动摄像机
    this.camera.x += (this.camera.targetX - this.camera.x) * 0.1;
    this.camera.y += (this.camera.targetY - this.camera.y) * 0.1;
  }

  update() {
    this.updateCamera();
    this.updateMoveAnimation();
  }

  render(ctx = this.ctx) {
    if (!this.isActive) return;

    // 清空画布
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    // 应用摄像机偏移
    ctx.translate(-this.camera.x, -this.camera.y);

    // 绘制棋盘格背景
    this.drawChessboardBackground(ctx);

    // 绘制格子之间的连接线
    this.drawGridConnections(ctx);

    // 绘制所有格子
    this.grids.forEach((grid, index) => {
      const isSelected = index === this.levelState.playerPosition;
      this.gridRenderer.drawGrid(grid, isSelected);
    });

    // 绘制玩家棋子
    const playerGrid = this.grids[this.levelState.playerPosition];
    if (playerGrid) {
      this.playerRenderer.drawPlayer(playerGrid, this.levelState.leaderHeroId);
    }

    ctx.restore();

    // 绘制UI（不受摄像机影响）
    this.drawBackButton();
    this.uiController.drawTopBar(this.levelState);
    this.uiController.drawBottomBar(this.levelState);
  }

  // 绘制棋盘格背景
  drawChessboardBackground(ctx) {
    const gridWidth = 70; // 与MapGenerator中的gridWidth匹配
    const gridHeight = 50; // 与MapGenerator中的gridHeight匹配
    const offsetX = 50;
    const offsetY = 50;

    // 绘制网格线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // 计算可见区域的起始和结束坐标
    const startX = Math.floor((this.camera.x - 100) / gridWidth) * gridWidth + offsetX;
    const endX = Math.ceil((this.camera.x + this.width + 100) / gridWidth) * gridWidth + offsetX;
    const startY = Math.floor((this.camera.y - 100) / gridHeight) * gridHeight + offsetY;
    const endY = Math.ceil((this.camera.y + this.height + 100) / gridHeight) * gridHeight + offsetY;

    // 绘制垂直线
    for (let x = startX; x < endX; x += gridWidth) {
      ctx.beginPath();
      ctx.moveTo(x, offsetY);
      ctx.lineTo(x, this.config.mapHeight);
      ctx.stroke();
    }

    // 绘制水平线
    for (let y = startY; y < endY; y += gridHeight) {
      ctx.beginPath();
      ctx.moveTo(offsetX, y);
      ctx.lineTo(this.config.mapWidth, y);
      ctx.stroke();
    }
  }

  // 绘制格子之间的连接线
  drawGridConnections(ctx) {
    if (this.grids.length < 2) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    // 绘制连接线
    for (let i = 0; i < this.grids.length - 1; i++) {
      const current = this.grids[i];
      const next = this.grids[i + 1];
      
      ctx.beginPath();
      ctx.moveTo(current.x, current.y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();
    }

    // 绘制首尾连接
    const first = this.grids[0];
    const last = this.grids[this.grids.length - 1];
    
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(first.x, first.y);
    ctx.stroke();

    ctx.restore();
  }

  gameLoop() {
    if (!this.isActive) return;

    this.update();
    this.render(this.ctx);
    requestAnimationFrame(() => this.gameLoop());
  }

  onTouch(x, y) {
    // 检查是否点击返回按钮
    if (this.uiController.checkBackButtonClick(x, y)) {
      console.log('点击返回按钮');
      this.returnToMainMenu();
      return;
    }
    
    // 确保场景处于活动状态
    if (!this.isActive) {
      console.log('激活场景');
      this.isActive = true;
      this.gameLoop();
    }
    
    // 检查是否点击骰子按钮
    console.log('检查骰子按钮点击:', {x, y, diceRemaining: this.levelState.diceRemaining});
    if (this.uiController.checkDiceButtonClick(x, y, this.levelState)) {
      console.log('点击骰子按钮');
      this.rollDice();
    }
  }

  // 返回主菜单
  returnToMainMenu() {
    console.log('返回主菜单');
    // 重置场景状态
    this.isActive = false;
    
    // 直接跳转到主菜单（通过重新初始化整个游戏）
    if (typeof wx !== 'undefined' && typeof wx.reLaunch === 'function') {
      // 在微信小游戏环境中，重新加载游戏
      wx.reLaunch({
        url: '/game.js'
      });
    } else {
      // 在其他环境中，重新创建场景选择器
      location.reload();
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

  // 绘制返回按钮
  drawBackButton() {
    const btn = this.backButton;
    if (!btn || !btn.callback) return;

    // 按钮背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.beginPath();
    this.ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 5);
    this.ctx.fill();

    // 按钮边框
    this.ctx.strokeStyle = '#f1c40f';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // 按钮文字
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('返回', btn.x + btn.width / 2, btn.y + btn.height / 2);
  }

  // 检查返回按钮点击
  checkBackButtonClick(x, y) {
    const btn = this.backButton;
    if (!btn || !btn.callback) return false;
    return x >= btn.x && x <= btn.x + btn.width &&
           y >= btn.y && y <= btn.y + btn.height;
  }

  // 处理返回按钮点击
  handleBackButtonClick() {
    if (this.backButton && this.backButton.callback) {
      this.backButton.callback();
    }
  }

  // 设置返回按钮回调
  setBackButton(callback) {
    this.backButton.callback = callback;
  }
}

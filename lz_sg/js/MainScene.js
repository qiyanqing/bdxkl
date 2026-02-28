// js/MainScene.js - 游戏主界面
import { playerDataManager } from './data/playerData.js';
import { TopBar } from './main/TopBar.js';
import { MainButton } from './main/MainButton.js';
import { BottomTab } from './main/BottomTab.js';
import { MapScene } from './map/MapScene.js';

export class MainScene {
  constructor(canvas, width, height) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = width;
    this.height = height;
    this.isActive = false;

    // 场景管理器引用（由外部设置）
    this.sceneManager = null;

    // 玩家数据
    this.playerData = null;

    // 子组件
    this.topBar = new TopBar(this.ctx, width, height);
    this.mainButton = new MainButton(this.ctx, width, height);
    this.bottomTab = new BottomTab(this.ctx, width, height);

    // 波纹效果列表
    this.ripples = [];

    // 返回按钮区域
    this.backButton = null;
  }

  /**
   * 初始化场景
   */
  init() {
    console.log('主界面初始化');
    this.isActive = true;

    // 加载玩家数据
    this.playerData = playerDataManager.load();

    // 绑定触摸事件
    this.bindTouchEvents();

    // 启动游戏循环
    this.lastTime = Date.now();
    this.gameLoop();
  }

  /**
   * 绑定触摸事件
   */
  bindTouchEvents() {
    wx.onTouchStart((e) => {
      if (!this.isActive) return;

      const touch = e.touches[0];
      const x = touch.x || touch.clientX || 0;
      const y = touch.y || touch.clientY || 0;

      this.handleTouch(x, y);
    });
  }

  /**
   * 处理触摸事件
   */
  handleTouch(x, y) {
    console.log('主界面触摸:', x, y);

    // 检查Tab点击
    const tabId = this.bottomTab.checkClick(x, y);
    if (tabId) {
      this.handleTabClick(tabId);
      return;
    }

    // 检查战斗按钮点击
    if (this.mainButton.checkClick(x, y)) {
      this.handleBattleButtonClick();
      return;
    }

    // 检查返回按钮点击
    if (this.backButton && this.checkBackButtonClick(x, y)) {
      this.handleBackButtonClick();
      return;
    }
  }

  /**
   * 处理Tab点击
   */
  handleTabClick(tabId) {
    console.log('点击Tab:', tabId);
    this.bottomTab.setSelectedTab(tabId);

    const tabInfo = this.bottomTab.getTabInfo(tabId);
    if (tabInfo) {
      console.log(`打开${tabInfo.name}界面`);
      // TODO: 打开对应的子场景
      this.showToast(`${tabInfo.name}功能开发中`);
    }
  }

  /**
   * 处理战斗按钮点击
   */
  handleBattleButtonClick() {
    console.log('点击战斗按钮');
    this.mainButton.triggerClickAnimation();

    // 添加波纹效果
    this.ripples.push({
      x: this.mainButton.config.centerX,
      y: this.mainButton.config.centerY,
      progress: 0,
    });

    // 延迟进入地图场景
    setTimeout(() => {
      this.enterMapScene();
    }, 300);
  }

  /**
   * 进入地图场景
   */
  enterMapScene() {
    console.log('进入地图场景');
    this.isActive = false;

    // 创建地图场景
    const mapScene = new MapScene(this.canvas, this.width, this.height);
    mapScene.init();

    // 设置返回按钮
    mapScene.setBackButton(() => {
      this.returnFromMapScene(mapScene);
    });
  }

  /**
   * 从地图场景返回
   */
  returnFromMapScene(mapScene) {
    console.log('从地图场景返回');
    mapScene.isActive = false;

    // 重新激活主场景
    this.isActive = true;

    // 重新加载玩家数据
    this.playerData = playerDataManager.load();

    // 恢复触摸事件绑定
    this.bindTouchEvents();

    // 恢复游戏循环
    this.gameLoop();
  }

  /**
   * 设置返回按钮
   */
  setBackButton(callback) {
    this.backButton = {
      x: this.width - 70,
      y: 10,
      width: 60,
      height: 30,
      callback: callback,
    };
  }

  /**
   * 检查返回按钮点击
   */
  checkBackButtonClick(x, y) {
    if (!this.backButton) return false;
    const btn = this.backButton;
    return x >= btn.x && x <= btn.x + btn.width &&
           y >= btn.y && y <= btn.y + btn.height;
  }

  /**
   * 处理返回按钮点击
   */
  handleBackButtonClick() {
    if (this.backButton && this.backButton.callback) {
      this.backButton.callback();
    }
  }

  /**
   * 显示Toast提示
   */
  showToast(message) {
    console.log('Toast:', message);
    // TODO: 实现Toast显示
  }

  /**
   * 更新
   */
  update() {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // 更新战斗按钮动画
    this.mainButton.update(deltaTime);

    // 更新波纹效果
    this.updateRipples();
  }

  /**
   * 更新波纹效果
   */
  updateRipples() {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const ripple = this.ripples[i];
      ripple.progress += 0.02;

      if (ripple.progress >= 1) {
        this.ripples.splice(i, 1);
      }
    }
  }

  /**
   * 渲染
   */
  render() {
    if (!this.isActive) return;

    // 清空画布
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 绘制背景装饰
    this.drawBackground();

    // 绘制顶部信息栏
    this.topBar.draw(this.playerData);

    // 绘制战斗按钮
    this.mainButton.draw();

    // 绘制波纹效果
    this.ripples.forEach(ripple => {
      this.mainButton.drawRipple(ripple.progress);
    });

    // 绘制底部Tab栏
    this.bottomTab.draw();

    // 绘制返回按钮
    if (this.backButton) {
      this.drawBackButton();
    }
  }

  /**
   * 绘制背景装饰
   */
  drawBackground() {
    // 绘制网格背景
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 1;

    const gridSize = 50;
    for (let x = 0; x < this.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }

    for (let y = 0; y < this.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  /**
   * 绘制返回按钮
   */
  drawBackButton() {
    if (!this.backButton) return;

    const btn = this.backButton;

    // 按钮背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.beginPath();
    this.ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 5);
    this.ctx.fill();

    // 按钮边框
    this.ctx.strokeStyle = '#f1c40f';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // 按钮文字
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('返回', btn.x + btn.width / 2, btn.y + btn.height / 2);
  }

  /**
   * 游戏循环
   */
  gameLoop() {
    if (!this.isActive) return;

    this.update();
    this.render();

    requestAnimationFrame(() => this.gameLoop());
  }
}

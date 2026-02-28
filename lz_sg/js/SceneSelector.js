// js/SceneSelector.js - 场景选择器
import { MapScene } from './map/MapScene.js';
import { BattleScene } from './BattleScene.js';

export class SceneSelector {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.currentScene = null;
  }

  init() {
    // 创建画布
    this.canvas = wx.createCanvas();
    this.ctx = this.canvas.getContext('2d');

    // 设置画布尺寸
    const { windowWidth, windowHeight } = wx.getSystemInfoSync();
    this.width = windowWidth;
    this.height = windowHeight;
    this.canvas.width = windowWidth;
    this.canvas.height = windowHeight;

    // 显示选择界面
    this.showSelector();

    // 绑定触摸事件
    wx.onTouchStart((e) => {
      this.handleTouch(e.touches[0].clientX, e.touches[0].clientY);
    });
  }

  showSelector() {
    // 清空画布
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 标题
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('三国卡牌战斗 - 开发测试', this.width / 2, 100);

    // 绘制两个按钮
    this.drawButton('地图探索', this.width / 2, 200, '#3498db');
    this.drawButton('战斗场景', this.width / 2, 300, '#e74c3c');
  }

  drawButton(text, x, y, color) {
    const width = 200;
    const height = 60;
    const x1 = x - width / 2;
    const y1 = y - height / 2;

    // 按钮背景
    this.ctx.fillStyle = color;
    this.drawRoundRect(this.ctx, x1, y1, width, height, 10);
    this.ctx.fill();

    // 按钮边框
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // 按钮文字
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x, y);
  }

  drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  }

  handleTouch(x, y) {
    if (this.currentScene) return; // 已进入场景，忽略点击

    // 检查地图探索按钮
    if (this.checkButton(x, y, this.width / 2, 200, 200, 60)) {
      this.enterMapScene();
    }
    // 检查战斗场景按钮
    else if (this.checkButton(x, y, this.width / 2, 300, 200, 60)) {
      this.enterBattleScene();
    }
  }

  checkButton(x, y, btnX, btnY, width, height) {
    return x >= btnX - width / 2 && x <= btnX + width / 2 &&
           y >= btnY - height / 2 && y <= btnY + height / 2;
  }

  enterMapScene() {
    console.log('进入地图探索场景');
    this.currentScene = new MapScene(this.canvas, this.width, this.height);
    this.currentScene.init();
  }

  enterBattleScene() {
    console.log('进入战斗场景');
    // 使用现有的 Game 类
    import('./Game.js').then(({ Game }) => {
      const game = new Game();
      game.init();
    });
  }
}

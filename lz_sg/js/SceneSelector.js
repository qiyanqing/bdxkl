// js/SceneSelector.js - 场景选择器
import { MapScene } from './map/MapScene.js';
import { BattleScene } from './BattleScene.js';
import { MainScene } from './MainScene.js';

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
    
    console.log('画布尺寸:', { width: windowWidth, height: windowHeight });

    // 显示选择界面
    this.showSelector();

    // 绑定触摸事件
    wx.onTouchStart((e) => {
      console.log('触摸事件触发:', e);
      const touch = e.touches[0];
      console.log('触摸点信息:', touch);
      
      // 尝试使用不同的坐标获取方式
      const touchX = touch.x || touch.clientX || touch.pageX;
      const touchY = touch.y || touch.clientY || touch.pageY;
      
      console.log('计算触摸坐标:', { x: touchX, y: touchY });
      this.handleTouch(touchX, touchY);
    });
    
    // 也绑定touchend事件作为备选
    wx.onTouchEnd((e) => {
      console.log('触摸结束事件:', e);
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

    // 绘制三个按钮
    this.drawButton('地图探索', this.width / 2, 200, '#3498db');
    this.drawButton('战斗场景', this.width / 2, 280, '#e74c3c');
    this.drawButton('游戏主界面', this.width / 2, 360, '#f39c12');
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
    console.log('触摸事件:', x, y);
    console.log('当前场景:', this.currentScene);

    // 如果已经在场景中，传递触摸事件
    if (this.currentScene) {
      if (this.currentScene.onTouch) {
        console.log('传递触摸事件给场景');
        this.currentScene.onTouch(x, y);
      }
      return;
    }

    // 检查按钮点击
    const buttonWidth = 200;
    const buttonHeight = 60;

    // 检查地图探索按钮
    if (this.checkButton(x, y, this.width / 2, 200, buttonWidth, buttonHeight)) {
      this.enterMapScene();
      return;
    }

    // 检查战斗场景按钮
    if (this.checkButton(x, y, this.width / 2, 280, buttonWidth, buttonHeight)) {
      this.enterBattleScene();
      return;
    }

    // 检查游戏主界面按钮
    if (this.checkButton(x, y, this.width / 2, 360, buttonWidth, buttonHeight)) {
      this.enterMainScene();
      return;
    }
  }

  checkButton(x, y, btnX, btnY, width, height) {
    const left = btnX - width / 2;
    const right = btnX + width / 2;
    const top = btnY - height / 2;
    const bottom = btnY + height / 2;
    
    console.log('按钮区域:', { left, right, top, bottom });
    console.log('触摸位置:', { x, y });
    console.log('是否在按钮内:', x >= left && x <= right && y >= top && y <= bottom);
    
    return x >= left && x <= right && y >= top && y <= bottom;
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

  enterMainScene() {
    console.log('进入游戏主界面');
    this.currentScene = new MainScene(this.canvas, this.width, this.height);
    this.currentScene.init();
  }
}

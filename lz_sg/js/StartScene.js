// js/StartScene.js - 启动场景
export class StartScene {
  constructor(game) {
    this.game = game;
    this.canvas = game.canvas;
    this.ctx = game.ctx;
    this.width = game.width;
    this.height = game.height;

    // 开始按钮区域
    this.startBtn = {
      x: this.width / 2 - 100,
      y: this.height / 2 + 50,
      width: 200,
      height: 80
    };
  }

  init() {
    console.log('启动场景初始化');
    this.render(this.ctx);
  }

  onTouch(x, y) {
    // 检查是否点击开始按钮
    if (x >= this.startBtn.x && x <= this.startBtn.x + this.startBtn.width &&
        y >= this.startBtn.y && y <= this.startBtn.y + this.startBtn.height) {
      console.log('点击开始按钮');
      this.game.showBattleScene();
    }
  }

  render(ctx) {
    // 绘制背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制标题
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('三国卡牌战斗', this.width / 2, this.height / 2 - 50);

    // 绘制副标题
    ctx.fillStyle = '#95a5a6';
    ctx.font = '24px Arial';
    ctx.fillText('MVP 原型 - 云开发版', this.width / 2, this.height / 2);

    // 绘制开始按钮
    this.drawButton(ctx);
  }

  drawButton(ctx) {
    // 按钮背景
    const gradient = ctx.createLinearGradient(
      this.startBtn.x, this.startBtn.y,
      this.startBtn.x, this.startBtn.y + this.startBtn.height
    );
    gradient.addColorStop(0, '#e74c3c');
    gradient.addColorStop(1, '#c0392b');

    ctx.fillStyle = gradient;
    this.drawRoundRect(ctx, this.startBtn.x, this.startBtn.y, this.startBtn.width, this.startBtn.height, 40);

    // 按钮文字
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('开始战斗', this.startBtn.x + this.startBtn.width / 2, this.startBtn.y + this.startBtn.height / 2);
  }

  drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }
}

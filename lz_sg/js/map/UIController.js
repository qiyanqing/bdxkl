// js/map/UIController.js
export class UIController {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  // 绘制顶部信息栏
  drawTopBar(levelState) {
    const barHeight = 40;
    const y = 0;

    this.ctx.save();

    // 背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, y, this.width, barHeight);

    // 文字信息
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';

    const info = `关卡${levelState.currentLevel} | 剩余骰子: ${levelState.diceRemaining}`;
    this.ctx.fillText(info, 20, y + barHeight / 2);

    this.ctx.restore();
  }

  // 绘制底部控制栏
  drawBottomBar(levelState) {
    const barHeight = 80;
    const y = this.height - barHeight;

    this.ctx.save();

    // 背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, y, this.width, barHeight);

    // 骰子按钮
    this.drawDiceButton(this.width / 2, y + barHeight / 2, levelState.diceRemaining > 0);

    this.ctx.restore();
  }

  // 绘制骰子按钮
  drawDiceButton(x, y, enabled) {
    const radius = 30;

    this.ctx.save();

    // 按钮圆形
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);

    // 渐变背景
    const gradient = this.ctx.createRadialGradient(x - 10, y - 10, 0, x, y, radius);
    if (enabled) {
      gradient.addColorStop(0, '#e74c3c');
      gradient.addColorStop(1, '#c0392b');
    } else {
      gradient.addColorStop(0, '#7f8c8d');
      gradient.addColorStop(1, '#95a5a6');
    }
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // 边框
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // 骰子图标
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('🎲', x, y);

    this.ctx.restore();
  }

  // 检查是否点击骰子按钮
  checkDiceButtonClick(x, y, levelState) {
    const buttonX = this.width / 2;
    const buttonY = this.height - 80 + 40; // 底部栏中心
    const radius = 30;

    const distance = Math.sqrt(Math.pow(x - buttonX, 2) + Math.pow(y - buttonY, 2));
    return distance <= radius && levelState.diceRemaining > 0;
  }
}

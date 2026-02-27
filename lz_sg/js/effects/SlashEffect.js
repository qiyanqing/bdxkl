// js/effects/SlashEffect.js - 近战刀光特效
export class SlashEffect {
  constructor(fromX, fromY, toX, toY, color = '#FFD700') {
    this.fromX = fromX;
    this.fromY = fromY;
    this.toX = toX;
    this.toY = toY;
    this.color = color;

    // 计算控制点（形成半月形）
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2 - 50; // 向上弯曲
    this.controlX = midX;
    this.controlY = midY;

    this.life = 0;      // 当前生命周期
    this.maxLife = 20;  // 最大生命周期（帧数）
    this.fade = true;   // 是否渐隐
  }

  update() {
    this.life++;
  }

  isComplete() {
    return this.life >= this.maxLife;
  }

  render(ctx) {
    const progress = this.life / this.maxLife;
    const alpha = this.fade ? (1 - progress) : 1;

    ctx.save();
    ctx.globalAlpha = alpha;

    // 绘制半月形刀光
    ctx.beginPath();
    ctx.moveTo(this.fromX, this.fromY);

    // 二次贝塞尔曲线形成弧形
    ctx.quadraticCurveTo(
      this.controlX,
      this.controlY,
      this.toX,
      this.toY
    );

    // 外发光效果
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 内层亮线
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }
}

// js/effects/BeamEffect.js - 远程光束特效
export class BeamEffect {
  constructor(fromX, fromY, toX, toY, color = '#3498DB') {
    this.fromX = fromX;
    this.fromY = fromY;
    this.toX = toX;
    this.toY = toY;
    this.color = color;

    this.life = 0;      // 当前生命周期
    this.maxLife = 15;  // 最大生命周期（帧数）
    this.width = 0;     // 当前光束宽度
    this.maxWidth = 6;  // 最大光束宽度

    // 爆炸效果标志
    this.hasExplosion = false;
  }

  update() {
    this.life++;

    // 光束宽度先变大后变小
    if (this.life < 5) {
      this.width = (this.life / 5) * this.maxWidth;
    } else if (this.life > 10) {
      this.width = ((this.maxLife - this.life) / 5) * this.maxWidth;
    } else {
      this.width = this.maxWidth;
    }
  }

  isComplete() {
    return this.life >= this.maxLife;
  }

  render(ctx) {
    const progress = this.life / this.maxLife;
    const alpha = this.life < 5 ? this.life / 5 : (this.maxLife - this.life) / 5;

    ctx.save();
    ctx.globalAlpha = Math.max(0.2, alpha);

    // 绘制光束
    ctx.beginPath();
    ctx.moveTo(this.fromX, this.fromY);
    ctx.lineTo(this.toX, this.toY);

    // 外层光晕
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 30;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width * 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 中层光束
    ctx.shadowBlur = 15;
    ctx.lineWidth = this.width * 2;
    ctx.stroke();

    // 内层亮线
    ctx.strokeStyle = '#FFFFFF';
    ctx.shadowBlur = 5;
    ctx.lineWidth = this.width * 0.5;
    ctx.stroke();

    // 绘制目标位置爆炸效果（光束到达时）
    if (this.life >= 3 && this.life <= 8) {
      this.drawExplosion(ctx);
    }

    ctx.restore();
  }

  drawExplosion(ctx) {
    const size = (this.life - 3) * 15; // 爆炸逐渐变大

    ctx.save();
    ctx.translate(this.toX, this.toY);

    // 绘制星形爆炸
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;
    ctx.fill();

    // 中心亮点
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.restore();
  }
}

// js/effects/DamageNumber.js - 伤害飘字特效
export class DamageNumber {
  constructor(x, y, damage, isSkill = false) {
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.isSkill = isSkill;

    this.life = 0;
    this.maxLife = 40;
    this.offsetY = 0;
  }

  update() {
    this.life++;
    // 向上飘动
    this.offsetY = this.life * 2;
  }

  isComplete() {
    return this.life >= this.maxLife;
  }

  render(ctx) {
    const progress = this.life / this.maxLife;
    const alpha = 1 - progress; // 逐渐消失

    ctx.save();
    ctx.globalAlpha = alpha;

    // 设置字体
    const fontSize = this.isSkill ? 36 : 28;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const x = this.x;
    const y = this.y - this.offsetY;

    // 技能伤害用金色，普通伤害用白色
    if (this.isSkill) {
      // 金色描边
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 4;
      ctx.strokeText(`-${this.damage}`, x, y);

      // 金色填充
      ctx.fillStyle = '#FFF700';
      ctx.fillText(`-${this.damage}`, x, y);
    } else {
      // 白色描边
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.strokeText(`-${this.damage}`, x, y);

      // 红色填充
      ctx.fillStyle = '#E74C3C';
      ctx.fillText(`-${this.damage}`, x, y);
    }

    ctx.restore();
  }
}

// js/effects/GachaEffectManager.js - 抽卡特效管理器
import { Rarity, RarityColors } from '../data/gachaPool.js';

/**
 * 抽卡特效管理器
 */
export class GachaEffectManager {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;

    // 特效状态
    this.state = {
      phase: 'idle', // idle, charging, bursting, revealing, complete
      progress: 0,
      particles: [],
      rings: [],
      lightning: [],
    };

    // 配置
    this.config = {
      centerX: width / 2,
      centerY: height / 2,
      arrayRadius: 80,
      maxRings: 5,
      maxParticles: 50,
    };
  }

  /**
   * 开始抽卡动画
   */
  startSummon() {
    this.state = {
      phase: 'charging',
      progress: 0,
      particles: [],
      rings: [],
      lightning: [],
    };

    // 初始化光环
    for (let i = 0; i < this.config.maxRings; i++) {
      this.state.rings.push({
        radius: this.config.arrayRadius,
        alpha: 1 - i * 0.15,
        rotation: Math.random() * Math.PI * 2,
        speed: 0.05 + i * 0.02,
      });
    }
  }

  /**
   * 开始展示结果
   */
  startReveal(rarity) {
    this.state.phase = 'revealing';
    this.state.progress = 0;
    this.state.rarity = rarity;

    // 创建爆发粒子
    const particleCount = rarity === Rarity.UR ? 80 : rarity === Rarity.SSR ? 50 : 30;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.state.particles.push({
        x: this.config.centerX,
        y: this.config.centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.01 + Math.random() * 0.02,
        size: 2 + Math.random() * 4,
        color: RarityColors[rarity],
      });
    }

    // 创建闪电效果（仅金卡）
    if (rarity === Rarity.UR) {
      for (let i = 0; i < 12; i++) {
        this.state.lightning.push({
          angle: (i / 12) * Math.PI * 2,
          length: 200 + Math.random() * 100,
          width: 2 + Math.random() * 3,
          life: 1,
          delay: Math.random() * 0.3,
        });
      }
    }
  }

  /**
   * 更新特效
   */
  update() {
    if (this.state.phase === 'idle') return;

    // 更新进度
    if (this.state.phase === 'charging') {
      this.state.progress += 0.015;
      if (this.state.progress >= 1) {
        this.state.progress = 1;
      }
    } else if (this.state.phase === 'revealing') {
      this.state.progress += 0.02;
      this.updateParticles();
      this.updateLightning();
    }

    // 更新光环
    this.updateRings();
  }

  /**
   * 更新光环
   */
  updateRings() {
    this.state.rings.forEach(ring => {
      ring.rotation += ring.speed;
      ring.radius += 0.5;
    });
  }

  /**
   * 更新粒子
   */
  updateParticles() {
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const p = this.state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.state.particles.splice(i, 1);
      }
    }
  }

  /**
   * 更新闪电
   */
  updateLightning() {
    for (let i = this.state.lightning.length - 1; i >= 0; i--) {
      const l = this.state.lightning[i];
      l.life -= 0.05;

      if (l.life <= 0) {
        this.state.lightning.splice(i, 1);
      }
    }
  }

  /**
   * 绘制特效
   */
  draw() {
    if (this.state.phase === 'idle') return;

    const { centerX, centerY } = this.config;

    // 绘制不同阶段的特效
    if (this.state.phase === 'charging') {
      this.drawChargingEffect(centerX, centerY);
    } else if (this.state.phase === 'revealing') {
      this.drawRevealEffect(centerX, centerY);
    }
  }

  /**
   * 绘制蓄力阶段特效
   */
  drawChargingEffect(centerX, centerY) {
    const progress = this.state.progress;
    const { arrayRadius } = this.config;

    // 绘制法阵背景
    this.drawArray(centerX, centerY, arrayRadius, progress);

    // 绘制光柱
    if (progress > 0.3) {
      this.drawLightPillar(centerX, centerY, progress);
    }

    // 绘制光环
    this.drawRings(centerX, centerY);

    // 绘制能量粒子
    this.drawEnergyParticles(centerX, centerY, progress);
  }

  /**
   * 绘制法阵
   */
  drawArray(centerX, centerY, radius, progress) {
    const ctx = this.ctx;
    const rotation = progress * Math.PI * 4;

    ctx.save();
    ctx.translate(centerX, centerY);

    // 外圈
    ctx.strokeStyle = `rgba(241, 196, 15, ${0.3 + progress * 0.5})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 旋转的八卦符号
    ctx.rotate(rotation);
    ctx.strokeStyle = `rgba(241, 196, 15, ${0.5 + progress * 0.3})`;
    ctx.lineWidth = 2;

    // 绘制八卦
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * radius * 0.7;
      const y = Math.sin(angle) * radius * 0.7;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // 内圈太极
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(168, 85, 247, ${0.5 + progress * 0.3})`;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 绘制光柱
   */
  drawLightPillar(centerX, centerY, progress) {
    const ctx = this.ctx;
    const pillarProgress = (progress - 0.3) / 0.7;

    ctx.save();

    // 渐变光柱
    const gradient = ctx.createLinearGradient(centerX, centerY, centerX, centerY - 300);
    gradient.addColorStop(0, `rgba(241, 196, 15, ${pillarProgress * 0.8})`);
    gradient.addColorStop(0.5, `rgba(241, 196, 15, ${pillarProgress * 0.4})`);
    gradient.addColorStop(1, 'rgba(241, 196, 15, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - 30, centerY - 300, 60, 300);

    ctx.restore();
  }

  /**
   * 绘制光环
   */
  drawRings(centerX, centerY) {
    const ctx = this.ctx;

    this.state.rings.forEach(ring => {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(ring.rotation);

      ctx.strokeStyle = `rgba(241, 196, 15, ${ring.alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    });
  }

  /**
   * 绘制能量粒子
   */
  drawEnergyParticles(centerX, centerY, progress) {
    const ctx = this.ctx;

    // 向上飘升的粒子
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 + progress * 2;
      const radius = 50 + progress * 100;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY - progress * 200 + Math.sin(angle * 3) * 20;

      const alpha = Math.max(0, 1 - progress * 1.5);

      ctx.fillStyle = `rgba(241, 196, 15, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * 绘制展示阶段特效
   */
  drawRevealEffect(centerX, centerY) {
    const progress = this.state.progress;
    const { rarity } = this.state;

    // 绘制粒子
    this.state.particles.forEach(p => {
      this.ctx.fillStyle = `${p.color}${Math.floor(p.life * 255).toString(16).padStart(2, '0')}`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // 绘制闪电（仅金卡）
    if (rarity === Rarity.UR) {
      this.drawLightning(centerX, centerY);
    }

    // 绘制光环扩散
    if (progress < 1) {
      this.drawShockwave(centerX, centerY, progress);
    }
  }

  /**
   * 绘制闪电
   */
  drawLightning(centerX, centerY) {
    const ctx = this.ctx;

    this.state.lightning.forEach(l => {
      if (l.life > 0 && l.delay <= 0) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(l.angle);

        ctx.strokeStyle = `rgba(241, 196, 15, ${l.life})`;
        ctx.lineWidth = l.width;
        ctx.beginPath();
        ctx.moveTo(0, 0);

        // 闪电折线
        const segments = 5;
        for (let i = 0; i < segments; i++) {
          const x = (i / segments) * l.length;
          const y = Math.sin(i * 2) * 20;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
        ctx.restore();
      }

      l.delay -= 0.016;
    });
  }

  /**
   * 绘制冲击波
   */
  drawShockwave(centerX, centerY, progress) {
    const ctx = this.ctx;
    const radius = progress * 400;
    const alpha = 1 - progress;

    ctx.strokeStyle = `rgba(241, 196, 15, ${alpha * 0.5})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * 检查是否完成
   */
  isComplete() {
    return this.state.phase === 'revealing' && this.state.progress >= 1;
  }

  /**
   * 重置
   */
  reset() {
    this.state = {
      phase: 'idle',
      progress: 0,
      particles: [],
      rings: [],
      lightning: [],
    };
  }
}

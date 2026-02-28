// js/main/MainButton.js - 中央战斗按钮

export class MainButton {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;

    // 按钮配置
    this.config = {
      centerX: width / 2,
      centerY: height / 2 + 20,
      radius: 90,
      mainText: '征战',
      subText: '关卡模式',
      mainFontSize: 48,
      subFontSize: 20,
    };

    // 颜色配置
    this.colors = {
      buttonStart: '#e74c3c',
      buttonEnd: '#c0392b',
      buttonHover: '#f39c12',
      textMain: '#f1c40f',
      textSub: '#ffffff',
      glow: 'rgba(241, 196, 15, 0.3)',
    };

    // 动画状态
    this.animation = {
      scale: 1,
      scaleDirection: 1,
      rotation: 0,
      clickScale: 1,
      isClicking: false,
    };

    // 点击区域
    this.clickArea = {
      x: this.config.centerX - this.config.radius,
      y: this.config.centerY - this.config.radius,
      width: this.config.radius * 2,
      height: this.config.radius * 2,
    };
  }

  /**
   * 更新动画
   */
  update(deltaTime) {
    // 呼吸动画
    const breatheSpeed = 0.002;
    this.animation.scale += breatheSpeed * this.animation.scaleDirection;
    if (this.animation.scale > 1.05) {
      this.animation.scale = 1.05;
      this.animation.scaleDirection = -1;
    } else if (this.animation.scale < 1.0) {
      this.animation.scale = 1.0;
      this.animation.scaleDirection = 1;
    }

    // 光环旋转
    this.animation.rotation += 0.001;

    // 点击动画恢复
    if (this.animation.isClicking) {
      this.animation.clickScale += 0.05;
      if (this.animation.clickScale >= 1) {
        this.animation.clickScale = 1;
        this.animation.isClicking = false;
      }
    }
  }

  /**
   * 绘制按钮
   */
  draw() {
    const { centerX, centerY, radius, mainText, subText, mainFontSize, subFontSize } = this.config;
    const currentRadius = radius * this.animation.scale * this.animation.clickScale;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);

    // 绘制光环（旋转效果）
    this.drawGlow(currentRadius);

    // 绘制按钮背景
    this.drawButtonBackground(currentRadius);

    // 绘制按钮边框
    this.drawButtonBorder(currentRadius);

    // 绘制文字
    this.drawText();

    this.ctx.restore();
  }

  /**
   * 绘制光环
   */
  drawGlow(radius) {
    const { glow } = this.colors;

    this.ctx.save();
    this.ctx.rotate(this.animation.rotation);

    // 外层光环
    const gradient = this.ctx.createRadialGradient(0, 0, radius * 0.8, 0, 0, radius * 1.3);
    gradient.addColorStop(0, 'rgba(241, 196, 15, 0)');
    gradient.addColorStop(0.5, glow);
    gradient.addColorStop(1, 'rgba(241, 196, 15, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  /**
   * 绘制按钮背景
   */
  drawButtonBackground(radius) {
    const { buttonStart, buttonEnd } = this.colors;

    const gradient = this.ctx.createRadialGradient(
      -radius * 0.3, -radius * 0.3, 0,
      0, 0, radius
    );
    gradient.addColorStop(0, buttonEnd);
    gradient.addColorStop(1, buttonStart);

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * 绘制按钮边框
   */
  drawButtonBorder(radius) {
    const { textMain } = this.colors;

    // 外边框
    this.ctx.strokeStyle = textMain;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius - 5, 0, Math.PI * 2);
    this.ctx.stroke();

    // 内边框
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius - 12, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  /**
   * 绘制文字
   */
  drawText() {
    const { mainText, subText, mainFontSize, subFontSize } = this.config;
    const { textMain, textSub } = this.colors;

    // 主文字
    this.ctx.fillStyle = textMain;
    this.ctx.font = `bold ${mainFontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(mainText, 0, -10);

    // 副文字
    this.ctx.fillStyle = textSub;
    this.ctx.font = `${subFontSize}px Arial`;
    this.ctx.fillText(subText, 0, 30);
  }

  /**
   * 检查是否点击了按钮
   */
  checkClick(x, y) {
    const { centerX, centerY, radius } = this.config;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    return distance <= radius;
  }

  /**
   * 触发点击动画
   */
  triggerClickAnimation() {
    this.animation.isClicking = true;
    this.animation.clickScale = 0.9;
  }

  /**
   * 绘制点击波纹效果
   */
  drawRipple(progress) {
    const { centerX, centerY, radius } = this.config;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);

    this.ctx.strokeStyle = `rgba(241, 196, 15, ${1 - progress})`;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * (1 + progress * 0.5), 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.restore();
  }
}

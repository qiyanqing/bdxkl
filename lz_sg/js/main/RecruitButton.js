// js/main/RecruitButton.js - 招募按钮

export class RecruitButton {
  constructor(ctx, width, height, battleButton) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.battleButton = battleButton; // 战斗按钮引用

    // 按钮配置
    this.config = {
      radius: 50,  // 比战斗按钮小
      mainText: '招募',
      subText: '抽卡',
      mainFontSize: 28,
      subFontSize: 14,
    };

    // 颜色配置
    this.colors = {
      buttonStart: '#a855f7',  // 紫色
      buttonEnd: '#7c3aed',
      buttonHover: '#c084fc',
      textMain: '#ffffff',
      textSub: '#e9d5ff',
      glow: 'rgba(168, 85, 247, 0.4)',
    };

    // 动画状态
    this.animation = {
      scale: 1,
      scaleDirection: 1,
      rotation: 0,
      clickScale: 1,
      isClicking: false,
    };

    // 计算位置（战斗按钮右侧）
    this.updatePosition();
  }

  /**
   * 更新按钮位置
   */
  updatePosition() {
    const battleCenterX = this.battleButton.config.centerX;
    const battleCenterY = this.battleButton.config.centerY;
    const battleRadius = this.battleButton.config.radius;
    const distance = battleRadius + this.config.radius + 30; // 间距30px

    this.config.centerX = battleCenterX + distance;
    this.config.centerY = battleCenterY;
  }

  /**
   * 更新动画
   */
  update(deltaTime) {
    // 呼吸动画（与战斗按钮同步但相位不同）
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

    // 绘制光环
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

    const gradient = this.ctx.createRadialGradient(0, 0, radius * 0.7, 0, 0, radius * 1.4);
    gradient.addColorStop(0, 'rgba(168, 85, 247, 0)');
    gradient.addColorStop(0.5, glow);
    gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 1.4, 0, Math.PI * 2);
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
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius - 3, 0, Math.PI * 2);
    this.ctx.stroke();

    // 内边框
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius - 8, 0, Math.PI * 2);
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
    this.ctx.fillText(mainText, 0, -5);

    // 副文字
    this.ctx.fillStyle = textSub;
    this.ctx.font = `${subFontSize}px Arial`;
    this.ctx.fillText(subText, 0, 18);
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

    this.ctx.strokeStyle = `rgba(168, 85, 247, ${1 - progress})`;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * (1 + progress * 0.5), 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.restore();
  }
}

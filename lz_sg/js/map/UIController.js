// js/map/UIController.js - 地图场景UI控制器（适配安全区域）
export class UIController {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;

    // 获取系统安全区域信息
    this.safeArea = this.getSafeArea();
  }

  /**
   * 获取系统安全区域信息
   */
  getSafeArea() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      const windowHeight = systemInfo.windowHeight || systemInfo.screenHeight;

      // 获取安全区域
      const safeArea = systemInfo.safeArea || {
        top: 0,
        bottom: windowHeight,
      };

      // 状态栏高度
      const statusBarHeight = systemInfo.statusBarHeight || 0;

      // 计算顶部安全区域高度
      const topSafeHeight = safeArea.top;

      // 判断是否是刘海屏/灵动岛
      const isNotchScreen = topSafeHeight > statusBarHeight + 5;

      // 计算底部安全区域高度（Home Indicator）
      const bottomSafeHeight = windowHeight - safeArea.bottom;

      // 判断是否有 Home Indicator
      const hasHomeIndicator = bottomSafeHeight > 5;

      return {
        top: topSafeHeight,
        bottom: safeArea.bottom,
        statusBarHeight,
        isNotchScreen,
        topOffset: isNotchScreen ? Math.max(10, topSafeHeight - statusBarHeight) : 0,
        bottomSafeHeight,
        hasHomeIndicator,
      };
    } catch (e) {
      console.error('获取安全区域失败:', e);
      return {
        top: 0,
        bottom: this.height,
        statusBarHeight: 0,
        isNotchScreen: false,
        topOffset: 0,
        bottomSafeHeight: 0,
        hasHomeIndicator: false,
      };
    }
  }

  // 绘制顶部信息栏（适配刘海屏/灵动岛）
  drawTopBar(levelState) {
    const barHeight = 40;
    const topSafeY = this.safeArea.top + this.safeArea.topOffset;
    const y = topSafeY;

    this.ctx.save();

    // 背景（延伸到屏幕顶部）
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.width, y + barHeight);

    // 绘制返回按钮
    this.drawBackButton(40, y + barHeight / 2);

    // 文字信息
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';

    const info = `关卡${levelState.currentLevel} | 剩余骰子: ${levelState.diceRemaining}`;
    this.ctx.fillText(info, 80, y + barHeight / 2);

    this.ctx.restore();
  }

  // 绘制返回按钮
  drawBackButton(x, y) {
    const radius = 15;

    this.ctx.save();

    // 按钮圆形
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);

    // 渐变背景
    const gradient = this.ctx.createRadialGradient(x - 5, y - 5, 0, x, y, radius);
    gradient.addColorStop(0, '#3498db');
    gradient.addColorStop(1, '#2980b9');
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // 边框
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // 返回图标
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('←', x, y);

    this.ctx.restore();
  }

  // 检查是否点击返回按钮（适配安全区域）
  checkBackButtonClick(x, y) {
    const topSafeY = this.safeArea.top + this.safeArea.topOffset;
    const buttonX = 40;
    const buttonY = topSafeY + 20; // 顶部栏中心
    const radius = 15;

    const distance = Math.sqrt(Math.pow(x - buttonX, 2) + Math.pow(y - buttonY, 2));
    return distance <= radius;
  }

  // 绘制底部控制栏（适配 Home Indicator）
  drawBottomBar(levelState) {
    const barHeight = 80;
    const bottomSafeHeight = this.safeArea.bottomSafeHeight;
    const y = this.height - barHeight - bottomSafeHeight;

    this.ctx.save();

    // 背景（延伸到屏幕底部）
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, y, this.width, barHeight + bottomSafeHeight);

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

  // 检查是否点击骰子按钮（适配安全区域）
  checkDiceButtonClick(x, y, levelState) {
    const barHeight = 80;
    const bottomSafeHeight = this.safeArea.bottomSafeHeight;
    const buttonX = this.width / 2;
    const buttonY = this.height - barHeight - bottomSafeHeight + barHeight / 2;
    const radius = 30;

    const distance = Math.sqrt(Math.pow(x - buttonX, 2) + Math.pow(y - buttonY, 2));
    return distance <= radius && levelState.diceRemaining > 0;
  }
}

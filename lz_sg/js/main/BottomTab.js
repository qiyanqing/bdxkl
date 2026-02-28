// js/main/BottomTab.js - 底部功能Tab栏（适配 Home Indicator）

export class BottomTab {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;

    // 获取系统安全区域信息
    this.safeArea = this.getSafeArea();

    // Tab配置
    this.tabs = [
      { id: 'hero', name: '角色', icon: '⚔️', color: '#e74c3c' },
      { id: 'bond', name: '羁绊', icon: '🤝', color: '#3498db' },
      { id: 'bag', name: '背包', icon: '🎒', color: '#f1c40f' },
      { id: 'achievement', name: '成就', icon: '🏆', color: '#22c55e' },
      { id: 'more', name: '更多', icon: '⋯', color: '#95a5a6' },
    ];

    // 布局参数
    this.config = {
      height: 70,
      iconSize: 28,
      fontSize: 12,
      indicatorHeight: 3,
      paddingTop: 8,
      spacing: 0, // 均匀分布
    };

    // 颜色配置
    this.colors = {
      background: 'rgba(22, 33, 62, 0.9)',
      textNormal: '#94a3b8',
      textSelected: '#f1c40f',
      iconNormal: '#94a3b8',
      iconSelected: '#f1c40f',
      indicator: '#f1c40f',
    };

    // 当前选中的Tab
    this.selectedTab = 'hero';

    // 点击区域缓存
    this.clickAreas = [];

    console.log('BottomTab 安全区域:', this.safeArea);
  }

  /**
   * 获取系统安全区域信息
   */
  getSafeArea() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      console.log('系统信息:', systemInfo);

      const windowHeight = systemInfo.windowHeight || systemInfo.screenHeight;
      const windowWidth = systemInfo.windowWidth || systemInfo.screenWidth;

      // 获取安全区域
      const safeArea = systemInfo.safeArea || {
        top: 0,
        left: 0,
        right: windowWidth,
        bottom: windowHeight,
      };

      // 计算底部安全区域高度（Home Indicator）
      // iPhone X 及以后的机型底部有 Home Indicator，高度约 34px
      const bottomSafeHeight = windowHeight - safeArea.bottom;

      // 判断是否有 Home Indicator
      const hasHomeIndicator = bottomSafeHeight > 5;

      return {
        top: safeArea.top,
        left: safeArea.left,
        right: safeArea.right,
        bottom: safeArea.bottom,
        windowHeight,
        windowWidth,
        bottomSafeHeight,
        hasHomeIndicator,
      };
    } catch (e) {
      console.error('获取安全区域失败:', e);
      return {
        top: 0,
        left: 0,
        right: this.width,
        bottom: this.height,
        windowHeight: this.height,
        windowWidth: this.width,
        bottomSafeHeight: 0,
        hasHomeIndicator: false,
      };
    }
  }

  /**
   * 获取 BottomTab 的实际 Y 坐标
   */
  getBottomTabY() {
    // 屏幕高度 - Tab栏高度 - 底部安全区域高度
    return this.height - this.config.height - this.safeArea.bottomSafeHeight;
  }

  /**
   * 获取 BottomBar 的实际高度（包括安全区域）
   */
  getBottomBarHeight() {
    return this.config.height + this.safeArea.bottomSafeHeight;
  }

  /**
   * 绘制底部Tab栏
   */
  draw() {
    const { height, iconSize, fontSize, indicatorHeight, paddingTop } = this.config;
    const y = this.getBottomTabY();
    const tabWidth = this.width / this.tabs.length;
    const totalHeight = this.getBottomBarHeight();

    // 清空点击区域缓存
    this.clickAreas = [];

    // 绘制背景（延伸到屏幕底部，覆盖 Home Indicator 区域）
    this.ctx.fillStyle = this.colors.background;
    this.ctx.fillRect(0, y, this.width, totalHeight);

    // 绘制每个Tab
    this.tabs.forEach((tab, index) => {
      const x = index * tabWidth;
      const centerX = x + tabWidth / 2;
      const isSelected = tab.id === this.selectedTab;

      // 绘制选中指示器
      if (isSelected) {
        this.drawIndicator(centerX, y, tabWidth, indicatorHeight);
      }

      // 绘制图标
      this.drawIcon(centerX, y + paddingTop + 5, iconSize, tab, isSelected);

      // 绘制文字
      this.drawText(centerX, y + paddingTop + iconSize + 8, fontSize, tab.name, isSelected);

      // 缓存点击区域
      this.clickAreas.push({
        id: tab.id,
        x: x,
        y: y,
        width: tabWidth,
        height: height, // 只记录内容高度，不包括安全区域
      });
    });

    // 绘制顶部边框线
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, y);
    this.ctx.lineTo(this.width, y);
    this.ctx.stroke();
  }

  /**
   * 绘制选中指示器
   */
  drawIndicator(centerX, y, tabWidth, height) {
    const indicatorWidth = 40;

    this.ctx.fillStyle = this.colors.indicator;
    this.ctx.fillRect(centerX - indicatorWidth / 2, y, indicatorWidth, height);
  }

  /**
   * 绘制图标
   */
  drawIcon(x, y, size, tab, isSelected) {
    this.ctx.font = `${size}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = isSelected ? this.colors.iconSelected : this.colors.iconNormal;

    // 如果选中，添加阴影效果
    if (isSelected) {
      this.ctx.shadowColor = tab.color;
      this.ctx.shadowBlur = 10;
    }

    this.ctx.fillText(tab.icon, x, y);

    // 重置阴影
    this.ctx.shadowBlur = 0;
  }

  /**
   * 绘制文字
   */
  drawText(x, y, size, text, isSelected) {
    this.ctx.fillStyle = isSelected ? this.colors.textSelected : this.colors.textNormal;
    this.ctx.font = isSelected ? `bold ${size}px Arial` : `${size}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(text, x, y);
  }

  /**
   * 检查点击
   */
  checkClick(x, y) {
    for (const area of this.clickAreas) {
      if (x >= area.x && x <= area.x + area.width &&
          y >= area.y && y <= area.y + area.height) {
        return area.id;
      }
    }
    return null;
  }

  /**
   * 设置选中的Tab
   */
  setSelectedTab(tabId) {
    if (this.tabs.find(tab => tab.id === tabId)) {
      this.selectedTab = tabId;
      return true;
    }
    return false;
  }

  /**
   * 获取当前选中的Tab
   */
  getSelectedTab() {
    return this.selectedTab;
  }

  /**
   * 获取Tab信息
   */
  getTabInfo(tabId) {
    return this.tabs.find(tab => tab.id === tabId);
  }

  /**
   * 获取内容区域的结束 Y 坐标（BottomTab 上方）
   */
  getContentEndY() {
    return this.getBottomTabY();
  }
}

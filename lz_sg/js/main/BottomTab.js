// js/main/BottomTab.js - 底部功能Tab栏

export class BottomTab {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;

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
  }

  /**
   * 绘制底部Tab栏
   */
  draw() {
    const { height, iconSize, fontSize, indicatorHeight, paddingTop } = this.config;
    const y = this.height - height;
    const tabWidth = this.width / this.tabs.length;

    // 清空点击区域缓存
    this.clickAreas = [];

    // 绘制背景
    this.ctx.fillStyle = this.colors.background;
    this.ctx.fillRect(0, y, this.width, height);

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
        height: height,
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
}

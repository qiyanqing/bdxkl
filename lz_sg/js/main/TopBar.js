// js/main/TopBar.js - 顶部信息栏

export class TopBar {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;

    // 布局参数
    this.config = {
      height: 80,
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: 15,
      paddingRight: 15,
      avatarSize: 50,
      fontSize: 16,
      smallFontSize: 14,
      iconSize: 24,
      spacing: 15,
    };

    // 颜色配置
    this.colors = {
      backgroundStart: '#1e3a8a',
      backgroundEnd: '#1e40af',
      text: '#ffffff',
      textSecondary: '#cbd5e1',
      gold: '#f1c40f',
      gems: '#a855f7',
      stamina: '#22c55e',
    };
  }

  /**
   * 绘制顶部信息栏
   */
  draw(playerData) {
    const { height, paddingTop, paddingLeft, paddingRight, avatarSize, fontSize, smallFontSize, iconSize, spacing } = this.config;
    const y = paddingTop;

    // 绘制背景渐变
    this.drawBackground();

    // 绘制头像区域
    this.drawAvatar(paddingLeft, y, avatarSize, playerData);

    // 绘制玩家信息
    const infoX = paddingLeft + avatarSize + spacing;
    this.drawPlayerInfo(infoX, y, fontSize, playerData);

    // 绘制资源栏
    this.drawResources(paddingRight, y, iconSize, smallFontSize, playerData);
  }

  /**
   * 绘制背景
   */
  drawBackground() {
    const { height } = this.config;
    const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, this.colors.backgroundStart);
    gradient.addColorStop(1, this.colors.backgroundEnd);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, height);
  }

  /**
   * 绘制头像
   */
  drawAvatar(x, y, size, playerData) {
    const { colors } = this;

    // 头像背景圆圈
    this.ctx.beginPath();
    this.ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    this.ctx.fillStyle = '#475569';
    this.ctx.fill();

    // 头像边框
    this.ctx.strokeStyle = '#f1c40f';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // 绘制默认头像（首字母）
    this.ctx.fillStyle = colors.text;
    this.ctx.font = `bold ${size * 0.4}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    const nickname = playerData.basicInfo.nickname || '玩家';
    const initial = nickname.charAt(nickname.length - 1) || '?';
    this.ctx.fillText(initial, x + size / 2, y + size / 2);
  }

  /**
   * 绘制玩家信息
   */
  drawPlayerInfo(x, y, fontSize, playerData) {
    const { text, textSecondary } = this.colors;
    const { basicInfo } = playerData;

    // 昵称
    this.ctx.fillStyle = text;
    this.ctx.font = `bold ${fontSize}px Arial`;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(basicInfo.nickname || '玩家', x, y + 5);

    // 等级
    this.ctx.fillStyle = textSecondary;
    this.ctx.font = `${fontSize - 2}px Arial`;
    this.ctx.fillText(`Lv.${basicInfo.level || 1}`, x, y + 28);
  }

  /**
   * 绘制资源栏
   */
  drawResources(rightX, y, iconSize, fontSize, playerData) {
    const { resources } = playerData;
    const { gold, gems, stamina, stamina: maxStamina } = this.colors;

    // 计算资源项宽度
    const itemWidth = 80;

    // 金币
    this.drawResourceItem(rightX - itemWidth * 3, y, iconSize, fontSize, '💰', resources.gold, gold);

    // 钻石
    this.drawResourceItem(rightX - itemWidth * 2, y, iconSize, fontSize, '💎', resources.gems, gems);

    // 体力
    const staminaText = `${resources.stamina}/${resources.maxStamina}`;
    this.drawResourceItem(rightX - itemWidth, y, iconSize, fontSize, '⚡', staminaText, stamina);
  }

  /**
   * 绘制单个资源项
   */
  drawResourceItem(x, y, iconSize, fontSize, icon, value, color) {
    // 图标
    this.ctx.font = `${iconSize}px Arial`;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(icon, x, y + 8);

    // 数值
    this.ctx.fillStyle = color;
    this.ctx.font = `bold ${fontSize}px Arial`;
    this.ctx.textAlign = 'left';
    this.ctx.fillText(value, x + iconSize + 5, y + 12);
  }

  /**
   * 检查是否点击了头像
   */
  checkAvatarClick(x, y) {
    const { paddingTop, paddingLeft, avatarSize } = this.config;
    const avatarX = paddingLeft;
    const avatarY = paddingTop;

    return x >= avatarX && x <= avatarX + avatarSize &&
           y >= avatarY && y <= avatarY + avatarSize;
  }
}

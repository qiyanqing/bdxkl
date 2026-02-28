// js/RecruitScene.js - 招募场景
import { gachaManager } from './data/GachaManager.js';
import { RarityColors, Rarity } from './data/gachaPool.js';

export class RecruitScene {
  constructor(canvas, width, height) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = width;
    this.height = height;
    this.isActive = false;

    // 返回回调
    this.backCallback = null;

    // 获取安全区域
    this.safeArea = this.getSafeArea();

    // 抽卡状态
    this.state = {
      isPulling: false,      // 是否正在抽卡
      pullType: null,        // 'single' 或 'ten'
      results: [],           // 抽卡结果
      animationProgress: 0,  // 抽卡动画进度
      showResults: false,    // 是否显示结果
      revealIndex: 0,        // 当前展示到第几张卡片
      revealBatches: [],     // 十连的展示批次 [2, 3, 3, 2]
      currentBatch: 0,       // 当前展示批次
      batchProgress: 0,      // 当前批次进度
      allCardsRevealed: false, // 所有卡片是否已展示完成
    };

    // 十连展示批次配置：2-3-3-2
    this.tenPullBatches = [2, 3, 3, 2];

    // 按钮配置
    this.buttons = {
      single: {
        x: width / 2 - 110,
        y: 0, // 将在布局中计算
        width: 100,
        height: 60,
        text: '单抽',
        cost: 100,
      },
      ten: {
        x: width / 2 + 10,
        y: 0,
        width: 100,
        height: 60,
        text: '十连',
        cost: 900,
      },
      back: {
        x: 0, // 将在布局中计算
        y: 0,
        width: 60,
        height: 30,
        text: '返回',
      },
    };

    // 卡片配置
    this.cardConfig = {
      width: 120,
      height: 160,
      gap: 15,
    };

    this.updateLayout();
  }

  /**
   * 获取安全区域
   */
  getSafeArea() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      const safeArea = systemInfo.safeArea || { top: 0, bottom: systemInfo.windowHeight };
      return {
        top: safeArea.top,
        bottom: safeArea.bottom,
        bottomSafeHeight: systemInfo.windowHeight - safeArea.bottom,
      };
    } catch (e) {
      return { top: 0, bottom: this.height, bottomSafeHeight: 0 };
    }
  }

  /**
   * 更新布局
   */
  updateLayout() {
    const topPadding = this.safeArea.top + 10;
    const bottomY = this.height - 100 - this.safeArea.bottomSafeHeight;

    // 返回按钮
    this.buttons.back.x = this.width - 70;
    this.buttons.back.y = topPadding;

    // 抽卡按钮
    this.buttons.single.y = bottomY;
    this.buttons.ten.y = bottomY;
  }

  /**
   * 初始化场景
   */
  init() {
    console.log('招募场景初始化');
    this.isActive = true;

    // 绑定触摸事件
    this.bindTouchEvents();

    // 启动游戏循环
    this.lastTime = Date.now();
    this.gameLoop();
  }

  /**
   * 绑定触摸事件
   */
  bindTouchEvents() {
    wx.onTouchStart((e) => {
      if (!this.isActive) return;

      const touch = e.touches[0];
      const x = touch.x || touch.clientX || 0;
      const y = touch.y || touch.clientY || 0;

      this.handleTouch(x, y);
    });
  }

  /**
   * 处理触摸事件
   */
  handleTouch(x, y) {
    // 如果正在抽卡动画中，点击跳过动画
    if (this.state.isPulling && !this.state.showResults) {
      this.skipAnimation();
      return;
    }

    // 如果显示结果，点击关闭结果
    if (this.state.showResults) {
      this.closeResults();
      return;
    }

    // 检查返回按钮
    if (this.checkButtonClick(x, y, this.buttons.back)) {
      this.handleBackClick();
      return;
    }

    // 检查单抽按钮
    if (this.checkButtonClick(x, y, this.buttons.single) && !this.state.isPulling) {
      this.handleSinglePull();
      return;
    }

    // 检查十连按钮
    if (this.checkButtonClick(x, y, this.buttons.ten) && !this.state.isPulling) {
      this.handleTenPull();
      return;
    }
  }

  /**
   * 检查按钮点击
   */
  checkButtonClick(x, y, button) {
    return x >= button.x && x <= button.x + button.width &&
           y >= button.y && y <= button.y + button.height;
  }

  /**
   * 处理返回点击
   */
  handleBackClick() {
    console.log('点击返回');
    this.isActive = false;
    if (this.backCallback) {
      this.backCallback();
    }
  }

  /**
   * 处理单抽
   */
  handleSinglePull() {
    console.log('执行单抽');
    this.state.isPulling = true;
    this.state.pullType = 'single';
    this.state.animationProgress = 0;
    this.state.showResults = false;

    // 立即执行抽卡
    const result = gachaManager.pullOne();
    this.state.results = [result];
  }

  /**
   * 处理十连
   */
  handleTenPull() {
    console.log('执行十连');
    this.state.isPulling = true;
    this.state.pullType = 'ten';
    this.state.animationProgress = 0;
    this.state.showResults = false;
    this.state.revealIndex = 0;
    this.state.currentBatch = 0;
    this.state.batchProgress = 0;
    this.state.allCardsRevealed = false;
    this.state.revealBatches = [];

    // 立即执行抽卡
    const results = gachaManager.pullTen();
    this.state.results = results;

    // 计算展示批次
    let startIndex = 0;
    for (const count of this.tenPullBatches) {
      this.state.revealBatches.push({
        start: startIndex,
        end: startIndex + count,
        count: count,
      });
      startIndex += count;
    }
  }

  /**
   * 跳过动画
   */
  skipAnimation() {
    if (this.state.pullType === 'ten') {
      // 十连跳过直接展示所有卡片
      this.state.animationProgress = 1;
      this.state.showResults = true;
      this.state.revealIndex = 10;
      this.state.currentBatch = 4;
      this.state.allCardsRevealed = true;
    } else {
      // 单抽直接展示结果
      this.state.animationProgress = 1;
      this.state.showResults = true;
    }
  }

  /**
   * 关闭结果
   */
  closeResults() {
    this.state.isPulling = false;
    this.state.showResults = false;
    this.state.results = [];
    this.state.revealIndex = 0;
    this.state.currentBatch = 0;
    this.state.allCardsRevealed = false;
  }

  /**
   * 设置返回回调
   */
  setBackCallback(callback) {
    this.backCallback = callback;
  }

  /**
   * 更新
   */
  update() {
    const deltaTime = Date.now() - this.lastTime;
    this.lastTime = Date.now();

    // 更新抽卡动画
    if (this.state.isPulling && !this.state.showResults) {
      this.state.animationProgress += 0.02;
      if (this.state.animationProgress >= 1) {
        this.state.animationProgress = 1;
        // 抽卡动画完成，开始展示结果
        setTimeout(() => {
          this.state.showResults = true;
        }, 200);
      }
    }

    // 更新卡片逐一展示动画（仅十连）
    if (this.state.showResults && this.state.pullType === 'ten' && !this.state.allCardsRevealed) {
      this.state.batchProgress += 0.015; // 控制展示速度

      if (this.state.batchProgress >= 1) {
        this.state.batchProgress = 0;

        // 展示当前批次的所有卡片
        if (this.state.currentBatch < this.state.revealBatches.length) {
          const batch = this.state.revealBatches[this.state.currentBatch];
          this.state.revealIndex = batch.end;
          this.state.currentBatch++;

          // 如果是最后一批，标记为全部展示完成
          if (this.state.currentBatch >= this.state.revealBatches.length) {
            this.state.allCardsRevealed = true;
          }
        }
      }
    }
  }

  /**
   * 渲染
   */
  render() {
    if (!this.isActive) return;

    // 清空画布
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 绘制背景
    this.drawBackground();

    // 绘制标题
    this.drawTitle();

    // 绘制保底进度
    this.drawPityProgress();

    // 如果正在抽卡
    if (this.state.isPulling) {
      if (this.state.showResults) {
        // 显示结果
        this.drawResults();
      } else {
        // 绘制抽卡动画
        this.drawPullAnimation();
      }
    }

    // 绘制抽卡按钮
    if (!this.state.isPulling) {
      this.drawButtons();
    }

    // 绘制返回按钮
    this.drawBackButton();
  }

  /**
   * 绘制背景
   */
  drawBackground() {
    // 绘制网格背景
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 1;

    const gridSize = 50;
    for (let x = 0; x < this.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }

    for (let y = 0; y < this.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  /**
   * 绘制标题
   */
  drawTitle() {
    const y = this.safeArea.top + 60;

    this.ctx.fillStyle = '#f1c40f';
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('英雄招募', this.width / 2, y);

    this.ctx.fillStyle = '#95a5a6';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('单抽100钻石 | 十连900钻石', this.width / 2, y + 35);
  }

  /**
   * 绘制保底进度
   */
  drawPityProgress() {
    const pity = gachaManager.getPityProgress();
    const y = this.safeArea.top + 130;

    // 金卡保底
    this.drawProgressBar(
      this.width / 2 - 150,
      y,
      140,
      20,
      pity.urProgress,
      pity.urMax,
      '#f1c40f',
      `金卡保底 ${pity.urRemaining}/${pity.urMax}`
    );

    // 紫卡保底
    this.drawProgressBar(
      this.width / 2 + 10,
      y,
      140,
      20,
      pity.ssrProgress,
      pity.ssrMax,
      '#a855f7',
      `紫卡保底 ${pity.ssrRemaining}/${pity.ssrMax}`
    );
  }

  /**
   * 绘制进度条
   */
  drawProgressBar(x, y, width, height, progress, max, color, label) {
    // 背景条
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(x, y, width, height);

    // 进度条
    const progressWidth = (progress / max) * width;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, progressWidth, height);

    // 边框
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);

    // 标签
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(label, x + width / 2, y + height / 2);
  }

  /**
   * 绘制抽卡动画
   */
  drawPullAnimation() {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const progress = this.state.animationProgress;

    // 绘制旋转的光环
    for (let i = 0; i < 3; i++) {
      const radius = 50 + i * 30 + progress * 100;
      const alpha = 1 - progress;

      this.ctx.save();
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate(progress * Math.PI * 2 + i * Math.PI / 3);

      this.ctx.strokeStyle = `rgba(241, 196, 15, ${alpha * 0.5})`;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.restore();
    }

    // 中心发光效果
    const glowRadius = 30 + progress * 50;
    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
    gradient.addColorStop(0, `rgba(241, 196, 15, ${1 - progress})`);
    gradient.addColorStop(1, 'rgba(241, 196, 15, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * 绘制抽卡结果
   */
  drawResults() {
    const results = this.state.results;
    const { width, height, gap } = this.cardConfig;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // 半透明背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 单抽直接展示
    if (this.state.pullType === 'single') {
      const x = centerX - width / 2;
      const y = centerY - height / 2;
      this.drawResultCard(x, y, width, height, results[0], 1);
    }
    // 十连按批次逐一展示
    else if (this.state.pullType === 'ten') {
      this.drawTenPullResults(centerX, centerY, width, height, gap);
    }

    // 提示文字（在最后一排卡片下方20px）
    const showHint = this.state.pullType === 'single' || this.state.allCardsRevealed;
    if (showHint) {
      let hintTextY;

      if (this.state.pullType === 'single') {
        // 单抽：卡片底部 + 20px
        hintTextY = centerY + height / 2 + 20;
      } else {
        // 十连：第4批卡片底部 + 20px
        const firstBatchY = 160;
        const batchGap = height + 5;
        const lastBatchY = firstBatchY + batchGap * 3;
        hintTextY = lastBatchY + height + 20;
      }

      this.ctx.fillStyle = '#fff';
      this.ctx.font = '18px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('点击任意位置关闭', this.width / 2, hintTextY);
    }
  }

  /**
   * 绘制十连抽卡结果（2-3-3-2 分批展示）
   */
  drawTenPullResults(centerX, centerY, cardWidth, cardHeight, gap) {
    const results = this.state.results;
    const revealIndex = this.state.revealIndex;

    // 重新计算布局，确保所有卡片在屏幕内且不重叠
    // 第1批从顶部往下 160px 开始
    const firstBatchY = 160;
    // 批次之间的间距 = 卡片高度 + 额外间距，确保不重叠
    const batchGap = cardHeight + 5; // 165px

    const positions = [];

    // 第1批：2张
    const batch1Width = 2 * cardWidth + gap;
    const batch1StartX = centerX - batch1Width / 2;
    positions.push({ x: batch1StartX, y: firstBatchY });
    positions.push({ x: batch1StartX + cardWidth + gap, y: firstBatchY });

    // 第2批：3张
    const batch2Width = 3 * cardWidth + 2 * gap;
    const batch2StartX = centerX - batch2Width / 2;
    const batch2Y = firstBatchY + batchGap;
    positions.push({ x: batch2StartX, y: batch2Y });
    positions.push({ x: batch2StartX + cardWidth + gap, y: batch2Y });
    positions.push({ x: batch2StartX + 2 * (cardWidth + gap), y: batch2Y });

    // 第3批：3张
    const batch3Width = 3 * cardWidth + 2 * gap;
    const batch3StartX = centerX - batch3Width / 2;
    const batch3Y = batch2Y + batchGap;
    positions.push({ x: batch3StartX, y: batch3Y });
    positions.push({ x: batch3StartX + cardWidth + gap, y: batch3Y });
    positions.push({ x: batch3StartX + 2 * (cardWidth + gap), y: batch3Y });

    // 第4批：2张
    const batch4Width = 2 * cardWidth + gap;
    const batch4StartX = centerX - batch4Width / 2;
    const batch4Y = batch3Y + batchGap;
    positions.push({ x: batch4StartX, y: batch4Y });
    positions.push({ x: batch4StartX + cardWidth + gap, y: batch4Y });

    // 绘制已展示的卡片
    for (let i = 0; i < revealIndex && i < results.length; i++) {
      const pos = positions[i];
      const result = results[i];

      // 计算当前卡片的动画进度
      let scale = 1;
      if (this.state.batchProgress < 1 && this.state.currentBatch > 0) {
        const batchInfo = this.state.revealBatches[this.state.currentBatch - 1];
        if (batchInfo && i >= batchInfo.start && i < batchInfo.end) {
          // 当前批次正在展示的卡片
          const indexInBatch = i - batchInfo.start;
          const countInBatch = batchInfo.count;
          const progressPerCard = 1 / countInBatch;
          const cardProgress = Math.min(1, this.state.batchProgress / progressPerCard);
          // 0 -> 1 的弹性动画
          scale = 1 + Math.sin(cardProgress * Math.PI) * 0.3;
          if (cardProgress >= 1) scale = 1;
        }
      }

      this.drawResultCard(pos.x, pos.y, cardWidth, cardHeight, result, scale);
    }
  }

  /**
   * 绘制结果卡片
   */
  drawResultCard(x, y, width, height, result, scale = 1) {
    const { character, rarity, isPity } = result;
    const color = RarityColors[rarity];

    // 应用缩放
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const scaledX = centerX - scaledWidth / 2;
    const scaledY = centerY - scaledHeight / 2;

    this.ctx.save();

    // 卡片背景
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = 0.3;
    this.ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
    this.ctx.globalAlpha = 1;

    // 卡片边框
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

    // 稀有度标签
    this.ctx.fillStyle = color;
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(rarity, centerX, scaledY + 25);

    // 角色头像
    this.ctx.font = `${Math.floor(48 * scale)}px Arial`;
    this.ctx.fillText(character.avatar, centerX, centerY);

    // 角色名称
    this.ctx.fillStyle = '#fff';
    this.ctx.font = `bold ${Math.floor(18 * scale)}px Arial`;
    this.ctx.fillText(character.name, centerX, scaledY + scaledHeight - 35);

    // 阵营
    this.ctx.font = `${Math.floor(14 * scale)}px Arial`;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fillText(character.faction, centerX, scaledY + scaledHeight - 15);

    // 保底标记
    if (isPity) {
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.fillText('保底', centerX, scaledY + 50);
    }

    this.ctx.restore();
  }

  /**
   * 绘制抽卡按钮
   */
  drawButtons() {
    this.drawButton(this.buttons.single, '#3498db');
    this.drawButton(this.buttons.ten, '#9333ea');

    // 绘制花费
    this.drawCost(this.buttons.single);
    this.drawCost(this.buttons.ten);
  }

  /**
   * 绘制按钮
   */
  drawButton(button, color) {
    // 按钮背景
    this.ctx.fillStyle = color;
    this.drawRoundRect(this.ctx, button.x, button.y, button.width, button.height, 10);
    this.ctx.fill();

    // 按钮边框
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // 按钮文字
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(button.text, button.x + button.width / 2, button.y + button.height / 2 - 10);
  }

  /**
   * 绘制花费
   */
  drawCost(button) {
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`💎 ${button.cost}`, button.x + button.width / 2, button.y + button.height - 12);
  }

  /**
   * 绘制返回按钮
   */
  drawBackButton() {
    const btn = this.buttons.back;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.beginPath();
    this.drawRoundRect(this.ctx, btn.x, btn.y, btn.width, btn.height, 5);
    this.ctx.fill();

    this.ctx.strokeStyle = '#f1c40f';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.fillStyle = '#f1c40f';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
  }

  /**
   * 绘制圆角矩形
   */
  drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  }

  /**
   * 游戏循环
   */
  gameLoop() {
    if (!this.isActive) return;

    this.update();
    this.render();

    requestAnimationFrame(() => this.gameLoop());
  }
}

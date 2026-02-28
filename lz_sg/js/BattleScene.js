// js/BattleScene.js - 战斗场景
import { Combat } from '../utils/combat.js';
import { heroes } from '../data/characters.js';
import { EffectManager } from './effects/EffectManager.js';

export class BattleScene {
  constructor(game) {
    this.game = game;
    this.canvas = game.canvas;
    this.ctx = game.ctx;
    this.width = game.width;
    this.height = game.height;

    this.combat = null;
    this.myHeroes = [];
    this.enemyHeroes = [];
    this.turn = 0;
    this.currentAction = '战斗开始！';
    this.battleResult = null;
    this.battleResultText = '';

    // 特效管理器
    this.effectManager = new EffectManager(this.ctx);

    // 卡牌受击效果 { id: { flash: 0, shakeX: 0, shakeY: 0 } }
    this.cardEffects = {};

    // 攻击者位移效果 { id: { offsetX: 0, offsetY: 0, returning: false } }
    this.attackEffects = {};

    // 战斗控制
    this.isPaused = false;           // 暂停状态
    this.speedMultiplier = 1;        // 倍速 1/2/3
    this.isBattling = false;         // 是否正在进行战斗循环

    // 按钮区域（位于黄忠卡片上方靠右）
    const cardWidth = 130;  // 卡片宽度
    const cardHeight = 175; // 缩短高度留出空余空间
    const gapX = 8;
    const gapY = 8;
    const row1Y = this.height - cardHeight * 2 - gapY - 20;
    const row1StartX = (this.width - (cardWidth * 3 + gapX * 2)) / 2;

    // 黄忠卡片（第一行最右边）的位置
    const huangzhongX = row1StartX + 2 * (cardWidth + gapX);

    // 按钮放在黄忠卡片上方靠右
    const buttonY = row1Y - 35; // 卡片上方35px
    const buttonSize = 40;

    this.speedBtn = {
      x: huangzhongX + cardWidth - 40, // 黄忠卡片右侧向内40px
      y: buttonY,
      radius: buttonSize / 2
    };

    this.pauseBtn = {
      x: huangzhongX + cardWidth - 90, // 倍速按钮左侧50px
      y: buttonY,
      radius: buttonSize / 2
    };

    // 重新开始按钮
    this.restartBtn = {
      x: this.width / 2 - 80,
      y: this.height / 2 + 80,
      width: 160,
      height: 60
    };
  }

  init() {
    console.log('战斗场景初始化');
    this.initBattle();
    this.gameLoop();
  }

  initBattle() {
    // 初始化我方角色
    this.myHeroes = heroes.map(h => ({
      ...h,
      currentHp: h.maxHp,
      currentMp: 0,
      x: 0, y: 0 // 卡牌位置
    }));

    // 初始化敌方角色
    this.enemyHeroes = heroes.map(h => ({
      ...h,
      id: h.id + '_enemy',
      name: h.name + '（敌）',
      currentHp: h.maxHp,
      currentMp: 0,
      x: 0, y: 0
    }));

    this.turn = 0;
    this.currentAction = '点击暂停按钮开始战斗';
    this.battleResult = null;
    this.battleResultText = '';
    this.isPaused = true;   // 默认暂停
    this.isBattling = false;

    // 清空特效和卡牌效果
    this.effectManager.clear();
    this.cardEffects = {};
    this.attackEffects = {};

    // 预加载角色立绘
    this.loadCharacterImages();

    // 创建战斗实例
    this.combat = new Combat(this.myHeroes, this.enemyHeroes);

    // 绑定回调
    this.combat.onAttack = this.onAttack.bind(this);
    this.combat.onSkill = this.onSkill.bind(this);

    // 初始化战斗
    this.combat.init();

    // 开始战斗（默认暂停，需要点击按钮开始）
    // setTimeout(() => {
    //   this.startBattle();
    // }, 1000);
  }

  // 预加载角色立绘
  loadCharacterImages() {
    this.characterImages = {};

    heroes.forEach(hero => {
      const img = wx.createImage();
      img.src = hero.image;
      img.onload = () => {
        this.characterImages[hero.id] = img;
        console.log(`立绘加载成功: ${hero.name}`);
      };
      img.onerror = () => {
        console.warn(`立绘加载失败: ${hero.name}, 使用占位图`);
        this.characterImages[hero.id] = null;
      };
    });
  }

  async startBattle() {
    // 检查是否暂停或战斗结束
    if (this.battleResult) return;

    // 如果暂停，等待恢复
    if (this.isPaused) {
      this.isBattling = false;
      return;
    }

    this.isBattling = true;
    const result = await this.combat.executeTurn();

    if (result) {
      this.handleBattleEnd(result);
      return;
    }

    // 根据倍速调整延迟
    const delay = 1500 / this.speedMultiplier;
    setTimeout(() => {
      this.startBattle();
    }, delay);
  }

  // 恢复战斗（从暂停状态）
  resumeBattle() {
    if (!this.isBattling && !this.battleResult) {
      this.startBattle();
    }
  }

  handleBattleEnd(result) {
    this.battleResult = result;
    this.battleResultText = result === 'win' ? '战斗胜利！' : '战斗失败！';
    this.currentAction = this.battleResultText;
    this.isBattling = false;
    console.log('战斗结束:', this.battleResultText);
  }

  async onAttack(attacker, target, damage) {
    this.currentAction = `${attacker.name} 攻击 ${target.name}，造成 ${damage} 点伤害`;

    // 计算卡牌中心点（卡牌宽度130，高度175）
    const fromX = attacker.x + 65;
    const fromY = attacker.y + 87;
    const toX = target.x + 65;
    const toY = target.y + 87;

    // 攻击者前进动画
    this.triggerAttackEffect(attacker.id, fromX, fromY, toX, toY);

    // 根据职业选择特效类型
    const isMelee = ['warrior', 'tank', 'assassin'].includes(attacker.job);

    if (isMelee) {
      this.effectManager.createSlashEffect(fromX, fromY, toX, toY, '#FFD700');
    } else {
      const color = attacker.job === 'mage' ? '#3498DB' : '#FFFFFF';
      this.effectManager.createBeamEffect(fromX, fromY, toX, toY, color);
    }

    // 增强受击效果
    this.triggerCardEffect(target.id, true);

    setTimeout(() => {
      this.effectManager.createDamageNumber(toX, toY, damage, false);
    }, 300 / this.speedMultiplier);

    // 根据倍速调整延迟
    await this.delay(500 / this.speedMultiplier);
  }

  async onSkill(hero, target, damage) {
    this.currentAction = `${hero.name} 释放 ${hero.skill.name}！造成 ${damage} 点伤害`;

    // 计算卡牌中心点（卡牌宽度130，高度175）
    const fromX = hero.x + 65;
    const fromY = hero.y + 87;
    const toX = target.x + 65;
    const toY = target.y + 87;

    // 攻击者前进动画
    this.triggerAttackEffect(hero.id, fromX, fromY, toX, toY);

    const isMelee = ['warrior', 'tank', 'assassin'].includes(hero.job);

    if (isMelee) {
      this.effectManager.createSlashEffect(fromX, fromY, toX, toY, '#FF6B6B');
    } else {
      this.effectManager.createBeamEffect(fromX, fromY, toX, toY, '#FFD700');
    }

    // 增强受击效果
    this.triggerCardEffect(target.id, true);

    setTimeout(() => {
      this.effectManager.createDamageNumber(toX, toY, damage, true);
    }, 300 / this.speedMultiplier);

    // 根据倍速调整延迟
    await this.delay(1000 / this.speedMultiplier);
  }

  // 触发攻击者前进动画
  triggerAttackEffect(heroId, fromX, fromY, toX, toY) {
    // 计算攻击方向
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 归一化方向
    const dirX = dx / distance;
    const dirY = dy / distance;

    // 前进距离（卡牌宽度的一半）
    const advanceDistance = 40;

    this.attackEffects[heroId] = {
      offsetX: dirX * advanceDistance,
      offsetY: dirY * advanceDistance,
      frame: 0,
      maxFrames: 10, // 前进10帧，后退10帧
      phase: 'advance' // advance / return
    };
  }

  // 触发卡牌受击效果（增强版）
  triggerCardEffect(heroId, enhanced = false) {
    if (enhanced) {
      // 增强版：更大的震动幅度，更长的持续时间
      this.cardEffects[heroId] = {
        flash: 12,    // 闪烁帧数（增加到12）
        shakeX: 15,   // 震动幅度（增加到15）
        shakeY: 8     // 垂直震动
      };
    } else {
      this.cardEffects[heroId] = {
        flash: 5,
        shakeX: 8,
        shakeY: 0
      };
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  onTouch(x, y) {
    // 检查是否点击暂停按钮（圆形）
    const pauseDist = Math.sqrt(Math.pow(x - this.pauseBtn.x, 2) + Math.pow(y - this.pauseBtn.y, 2));
    if (pauseDist <= this.pauseBtn.radius) {
      this.togglePause();
      return;
    }

    // 检查是否点击倍速按钮（圆形）
    const speedDist = Math.sqrt(Math.pow(x - this.speedBtn.x, 2) + Math.pow(y - this.speedBtn.y, 2));
    if (speedDist <= this.speedBtn.radius) {
      this.toggleSpeed();
      return;
    }

    // 检查是否点击重新开始按钮
    if (this.battleResult &&
        x >= this.restartBtn.x && x <= this.restartBtn.x + this.restartBtn.width &&
        y >= this.restartBtn.y && y <= this.restartBtn.y + this.restartBtn.height) {
      this.initBattle();
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    console.log('战斗暂停:', this.isPaused);

    if (!this.isPaused) {
      // 恢复战斗
      this.currentAction = '战斗继续！';
      this.resumeBattle();
    } else {
      this.currentAction = '战斗暂停';
    }
  }

  toggleSpeed() {
    this.speedMultiplier = this.speedMultiplier === 1 ? 2 : (this.speedMultiplier === 2 ? 3 : 1);
    console.log('战斗倍速:', this.speedMultiplier + 'x');
    this.currentAction = `战斗速度: ${this.speedMultiplier}x`;
  }

  update() {
    // 更新特效
    this.effectManager.update();

    // 更新攻击者位移效果
    Object.keys(this.attackEffects).forEach(id => {
      const effect = this.attackEffects[id];
      effect.frame++;

      if (effect.phase === 'advance') {
        // 前进阶段
        if (effect.frame >= effect.maxFrames) {
          effect.phase = 'return';
          effect.frame = 0;
        }
      } else {
        // 后退阶段
        if (effect.frame >= effect.maxFrames) {
          delete this.attackEffects[id];
        }
      }
    });

    // 更新卡牌受击效果
    Object.keys(this.cardEffects).forEach(id => {
      const effect = this.cardEffects[id];

      if (effect.flash > 0) {
        effect.flash--;
      }

      if (effect.shakeX !== 0) {
        effect.shakeX = -effect.shakeX; // 左右震动
        if (effect.flash === 0) {
          effect.shakeX = 0;
          effect.shakeY = 0;
        }
      }

      if (effect.shakeY !== 0) {
        effect.shakeY = -effect.shakeY; // 上下震动
        if (effect.flash === 0) {
          effect.shakeY = 0;
        }
      }
    });

    // 清理已完成的卡牌效果
    Object.keys(this.cardEffects).forEach(id => {
      const effect = this.cardEffects[id];
      if (effect.flash === 0 && effect.shakeX === 0 && effect.shakeY === 0) {
        delete this.cardEffects[id];
      }
    });
  }

  render(ctx) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.width, this.height);

    this.drawEnemyArea(ctx);
    this.drawMyArea(ctx);
    this.effectManager.render();

    // 绘制控制按钮
    this.drawControlButtons(ctx);

    this.drawBattleInfo(ctx);
  }

  drawControlButtons(ctx) {
    // 倍速按钮
    this.drawCircleButton(ctx, this.speedBtn, `${this.speedMultiplier}x`, '#9B59B6');

    // 暂停/继续按钮
    const pauseText = this.isPaused ? '▶' : '⏸';
    const pauseColor = this.isPaused ? '#2ECC71' : '#E74C3C';
    this.drawCircleButton(ctx, this.pauseBtn, pauseText, pauseColor);
  }

  drawCircleButton(ctx, btn, text, color) {
    ctx.save();

    // 按钮背景（圆形）
    const gradient = ctx.createRadialGradient(btn.x, btn.y, 0, btn.x, btn.y, btn.radius);
    gradient.addColorStop(0, this.lightenColor(color, 20));
    gradient.addColorStop(1, color);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(btn.x, btn.y, btn.radius, 0, Math.PI * 2);
    ctx.fill();

    // 边框
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 文字/符号
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, btn.x, btn.y);

    ctx.restore();
  }

  // 颜色变亮
  lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min((num >> 16) + amt, 255);
    const G = Math.min((num >> 8 & 0x00FF) + amt, 255);
    const B = Math.min((num & 0x0000FF) + amt, 255);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  drawEnemyArea(ctx) {
    const cardWidth = 130;  // 卡片宽度
    const cardHeight = 175; // 缩短高度留出空余空间
    const gapX = 8;
    const gapY = 8;

    // 第一行（3张）
    const row1Y = 20;
    const row1StartX = (this.width - (cardWidth * 3 + gapX * 2)) / 2;

    // 第二行（3张）
    const row2Y = row1Y + cardHeight + gapY;
    const row2StartX = row1StartX;

    this.enemyHeroes.forEach((hero, index) => {
      let x, y;
      if (index < 3) {
        // 第一行
        x = row1StartX + index * (cardWidth + gapX);
        y = row1Y;
      } else {
        // 第二行
        x = row2StartX + (index - 3) * (cardWidth + gapX);
        y = row2Y;
      }
      hero.x = x;
      hero.y = y;
      this.drawCard(ctx, hero, x, y, cardWidth, cardHeight);
    });
  }

  drawMyArea(ctx) {
    const cardWidth = 130;  // 卡片宽度
    const cardHeight = 175; // 缩短高度留出空余空间
    const gapX = 8;
    const gapY = 8;

    // 第一行（3张）
    const row1Y = this.height - cardHeight * 2 - gapY - 20;
    const row1StartX = (this.width - (cardWidth * 3 + gapX * 2)) / 2;

    // 第二行（3张）
    const row2Y = row1Y + cardHeight + gapY;
    const row2StartX = row1StartX;

    this.myHeroes.forEach((hero, index) => {
      let x, y;
      if (index < 3) {
        // 第一行
        x = row1StartX + index * (cardWidth + gapX);
        y = row1Y;
      } else {
        // 第二行
        x = row2StartX + (index - 3) * (cardWidth + gapX);
        y = row2Y;
      }
      hero.x = x;
      hero.y = y;
      this.drawCard(ctx, hero, x, y, cardWidth, cardHeight);
    });
  }

  drawCard(ctx, hero, x, y, width, height) {
    // 获取受击效果
    const hitEffect = this.cardEffects[hero.id] || { flash: 0, shakeX: 0, shakeY: 0 };

    // 获取攻击位移效果
    const attackEffect = this.attackEffects[hero.id];
    let attackOffsetX = 0;
    let attackOffsetY = 0;

    if (attackEffect) {
      const progress = attackEffect.frame / attackEffect.maxFrames;
      if (attackEffect.phase === 'advance') {
        // 前进：平滑移动
        const easedProgress = this.easeInOutQuad(progress);
        attackOffsetX = attackEffect.offsetX * easedProgress;
        attackOffsetY = attackEffect.offsetY * easedProgress;
      } else {
        // 后退：平滑回归
        const easedProgress = this.easeInOutQuad(progress);
        attackOffsetX = attackEffect.offsetX * (1 - easedProgress);
        attackOffsetY = attackEffect.offsetY * (1 - easedProgress);
      }
    }

    const drawX = x + hitEffect.shakeX + attackOffsetX;
    const drawY = y + hitEffect.shakeY + attackOffsetY;

    // 绘制卡片边框和背景
    ctx.fillStyle = hero.currentHp <= 0 ? '#333' : '#16213e';
    ctx.strokeStyle = hero.currentHp <= 0 ? '#555' : '#0f3460';
    ctx.lineWidth = 2;
    this.drawRoundRect(ctx, drawX, drawY, width, height, 10);
    ctx.fill();
    ctx.stroke();

    // 立绘填满整个卡片区域
    this.drawPortrait(ctx, hero, drawX, drawY, width, height);

    // 角色名（左上角，带描边效果确保清晰可见）
    const nameX = drawX + 8;
    const nameY = drawY + 18;

    // 文字描边（黑色）
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.strokeText(hero.name, nameX, nameY);

    // 文字填充（白色）
    ctx.fillStyle = hero.currentHp <= 0 ? '#999' : '#fff';
    ctx.fillText(hero.name, nameX, nameY);

    // 底部血蓝条区域（半透明黑色背景）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.drawRoundRect(ctx, drawX + 2, drawY + height - 26, width - 4, 24, 6);
    ctx.fill();

    // 血条和蓝条
    this.drawHpBar(ctx, drawX + 6, drawY + height - 22, width - 12, 10, hero.currentHp, hero.maxHp);
    this.drawMpBar(ctx, drawX + 6, drawY + height - 11, width - 12, 6, hero.currentMp, hero.maxMp);
  }

  // 绘制立绘（或占位图）
  drawPortrait(ctx, hero, x, y, width, height) {
    // 敌方角色的ID包含'_enemy'后缀，需要去掉才能找到立绘图片
    const imageId = hero.id.replace('_enemy', '');
    const portraitImg = this.characterImages ? this.characterImages[imageId] : null;

    if (portraitImg && portraitImg.complete && portraitImg.width > 0) {
      // 有立绘图片：绘制图片
      const imgWidth = width;
      const imgHeight = height;
      const imgX = x;
      const imgY = y;

      ctx.save();
      // 裁剪区域（圆角矩形）
      this.drawRoundRect(ctx, imgX, imgY, imgWidth, imgHeight, 8);
      ctx.clip();

      // 绘制图片（保持比例，覆盖整个区域）
      ctx.drawImage(portraitImg, imgX, imgY, imgWidth, imgHeight);

      ctx.restore();
    } else {
      // 无立绘：显示占位图（色块+首字）
      this.drawPlaceholderPortrait(ctx, hero, x, y, width, height);
    }
  }

  // 绘制占位图（临时方案）
  drawPlaceholderPortrait(ctx, hero, x, y, width, height) {
    // 获取角色首字
    const firstChar = hero.name.charAt(0);

    // 根据稀有度选择颜色
    let bgColor;
    switch (hero.rarity) {
      case 'gold': bgColor = '#FFD700'; break;
      case 'purple': bgColor = '#9B59B6'; break;
      case 'blue': bgColor = '#3498DB'; break;
      default: bgColor = '#95a5a6';
    }

    // 绘制色块背景（填满整个卡片区域）
    ctx.save();
    this.drawRoundRect(ctx, x + 2, y + 2, width - 4, height - 4, 8);
    ctx.clip();
    ctx.fillStyle = bgColor;
    ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
    ctx.restore();

    // 绘制首字（居中显示）
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(firstChar, x + width / 2, y + height / 2);
  }

  // 缓动函数（平滑动画）
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  drawHpBar(ctx, x, y, width, height, current, max) {
    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y, width, height);

    // 血条
    const percent = Math.max(0, current / max);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(x, y, width * percent, height);

    // 数字（显示在血条内）
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.floor(current), x + width / 2, y + height / 2);
  }

  drawMpBar(ctx, x, y, width, height, current, max) {
    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y, width, height);

    // 蓝条
    const percent = Math.max(0, current / max);
    ctx.fillStyle = '#3498db';
    ctx.fillRect(x, y, width * percent, height);
  }

  drawBattleInfo(ctx) {
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`回合: ${this.turn}`, centerX, centerY - 80);

    ctx.fillStyle = '#ecf0f1';
    ctx.font = '20px Arial';
    ctx.fillText(this.currentAction, centerX, centerY - 40);

    if (this.battleResult) {
      ctx.fillStyle = this.battleResult === 'win' ? '#2ecc71' : '#e74c3c';
      ctx.font = 'bold 40px Arial';
      ctx.fillText(this.battleResultText, centerX, centerY + 20);
      this.drawRestartButton(ctx);
    }
  }

  drawRestartButton(ctx) {
    const gradient = ctx.createLinearGradient(
      this.restartBtn.x, this.restartBtn.y,
      this.restartBtn.x, this.restartBtn.y + this.restartBtn.height
    );
    gradient.addColorStop(0, '#3498db');
    gradient.addColorStop(1, '#2980b9');

    ctx.fillStyle = gradient;
    this.drawRoundRect(ctx, this.restartBtn.x, this.restartBtn.y, this.restartBtn.width, this.restartBtn.height, 30);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('重新开始', this.restartBtn.x + this.restartBtn.width / 2, this.restartBtn.y + this.restartBtn.height / 2);
  }

  drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  gameLoop() {
    this.update();
    this.render(this.ctx);
    requestAnimationFrame(() => this.gameLoop());
  }
}

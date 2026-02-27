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

    // 战斗控制
    this.isPaused = false;           // 暂停状态
    this.speedMultiplier = 1;        // 倍速 1/2/3
    this.isBattling = false;         // 是否正在进行战斗循环

    // 按钮区域
    this.pauseBtn = {
      x: this.width - 70,
      y: 10,
      width: 60,
      height: 40
    };

    this.speedBtn = {
      x: this.width - 140,
      y: 10,
      width: 60,
      height: 40
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
    this.currentAction = '战斗开始！';
    this.battleResult = null;
    this.battleResultText = '';
    this.isPaused = false;
    this.isBattling = false;

    // 清空特效和卡牌效果
    this.effectManager.clear();
    this.cardEffects = {};

    // 创建战斗实例
    this.combat = new Combat(this.myHeroes, this.enemyHeroes);

    // 绑定回调
    this.combat.onAttack = this.onAttack.bind(this);
    this.combat.onSkill = this.onSkill.bind(this);

    // 初始化战斗
    this.combat.init();

    // 开始战斗
    setTimeout(() => {
      this.startBattle();
    }, 1000);
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

    // 计算卡牌中心点
    const fromX = attacker.x + 100;
    const fromY = attacker.y + 75;
    const toX = target.x + 100;
    const toY = target.y + 75;

    // 根据职业选择特效类型
    const isMelee = ['warrior', 'tank', 'assassin'].includes(attacker.job);

    if (isMelee) {
      this.effectManager.createSlashEffect(fromX, fromY, toX, toY, '#FFD700');
    } else {
      const color = attacker.job === 'mage' ? '#3498DB' : '#FFFFFF';
      this.effectManager.createBeamEffect(fromX, fromY, toX, toY, color);
    }

    this.triggerCardEffect(target.id);

    setTimeout(() => {
      this.effectManager.createDamageNumber(toX, toY, damage, false);
    }, 300 / this.speedMultiplier);

    // 根据倍速调整延迟
    await this.delay(500 / this.speedMultiplier);
  }

  async onSkill(hero, target, damage) {
    this.currentAction = `${hero.name} 释放 ${hero.skill.name}！造成 ${damage} 点伤害`;

    const fromX = hero.x + 100;
    const fromY = hero.y + 75;
    const toX = target.x + 100;
    const toY = target.y + 75;

    const isMelee = ['warrior', 'tank', 'assassin'].includes(hero.job);

    if (isMelee) {
      this.effectManager.createSlashEffect(fromX, fromY, toX, toY, '#FF6B6B');
    } else {
      this.effectManager.createBeamEffect(fromX, fromY, toX, toY, '#FFD700');
    }

    this.triggerCardEffect(target.id);

    setTimeout(() => {
      this.effectManager.createDamageNumber(toX, toY, damage, true);
    }, 300 / this.speedMultiplier);

    // 根据倍速调整延迟
    await this.delay(1000 / this.speedMultiplier);
  }

  triggerCardEffect(heroId) {
    this.cardEffects[heroId] = {
      flash: 5,
      shakeX: 8,
      shakeY: 0
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  onTouch(x, y) {
    // 检查是否点击暂停按钮
    if (x >= this.pauseBtn.x && x <= this.pauseBtn.x + this.pauseBtn.width &&
        y >= this.pauseBtn.y && y <= this.pauseBtn.y + this.pauseBtn.height) {
      this.togglePause();
      return;
    }

    // 检查是否点击倍速按钮
    if (x >= this.speedBtn.x && x <= this.speedBtn.x + this.speedBtn.width &&
        y >= this.speedBtn.y && y <= this.speedBtn.y + this.speedBtn.height) {
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

    // 更新卡牌受击效果
    Object.keys(this.cardEffects).forEach(id => {
      const effect = this.cardEffects[id];

      if (effect.flash > 0) {
        effect.flash--;
      }

      if (effect.shakeX > 0) {
        effect.shakeX = -effect.shakeX;
        if (effect.flash === 0) {
          effect.shakeX = 0;
        }
      }
    });

    // 清理已完成的卡牌效果
    Object.keys(this.cardEffects).forEach(id => {
      const effect = this.cardEffects[id];
      if (effect.flash === 0 && effect.shakeX === 0) {
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
    this.drawButton(ctx, this.speedBtn, `${this.speedMultiplier}x`, '#9B59B6');

    // 暂停/继续按钮
    const pauseText = this.isPaused ? '▶' : '⏸';
    const pauseColor = this.isPaused ? '#2ECC71' : '#E74C3C';
    this.drawButton(ctx, this.pauseBtn, pauseText, pauseColor);
  }

  drawButton(ctx, btn, text, color) {
    ctx.save();

    // 按钮背景
    const gradient = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, this.darkenColor(color, 20));

    ctx.fillStyle = gradient;
    this.drawRoundRect(ctx, btn.x, btn.y, btn.width, btn.height, 8);
    ctx.fill();

    // 边框
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 文字
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, btn.x + btn.width / 2, btn.y + btn.height / 2);

    ctx.restore();
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
    const startX = 20;
    const startY = 20;
    const cardWidth = this.width / 3 - 30;
    const cardHeight = 150;
    const gap = 10;

    this.enemyHeroes.forEach((hero, index) => {
      const x = startX + index * (cardWidth + gap);
      const y = startY;
      hero.x = x;
      hero.y = y;
      this.drawCard(ctx, hero, x, y, cardWidth, cardHeight);
    });
  }

  drawMyArea(ctx) {
    const startX = 20;
    const cardWidth = this.width / 3 - 30;
    const cardHeight = 150;
    const gap = 10;
    const startY = this.height - cardHeight - 20;

    this.myHeroes.forEach((hero, index) => {
      const x = startX + index * (cardWidth + gap);
      const y = startY;
      hero.x = x;
      hero.y = y;
      this.drawCard(ctx, hero, x, y, cardWidth, cardHeight);
    });
  }

  drawCard(ctx, hero, x, y, width, height) {
    const effect = this.cardEffects[hero.id] || { flash: 0, shakeX: 0, shakeY: 0 };
    const drawX = x + effect.shakeX;
    const drawY = y + effect.shakeY;

    let bgColor = hero.currentHp <= 0 ? '#333' : '#16213e';

    if (effect.flash > 0 && effect.flash % 2 === 0) {
      bgColor = '#FFFFFF';
    }

    ctx.fillStyle = bgColor;
    ctx.strokeStyle = hero.currentHp <= 0 ? '#555' : '#0f3460';
    ctx.lineWidth = 2;
    this.drawRoundRect(ctx, drawX, drawY, width, height, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = hero.currentHp <= 0 ? '#666' : '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(hero.name, drawX + width / 2, drawY + 30);

    ctx.fillStyle = '#95a5a6';
    ctx.font = '14px Arial';
    ctx.fillText(hero.job, drawX + width / 2, drawY + 50);

    this.drawBar(ctx, drawX + 10, drawY + 70, width - 20, 15, hero.currentHp, hero.maxHp, '#e74c3c');
    this.drawBar(ctx, drawX + 10, drawY + 95, width - 20, 15, hero.currentMp, hero.maxMp, '#3498db');
  }

  drawBar(ctx, x, y, width, height, current, max, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y, width, height);

    const percent = Math.max(0, current / max);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width * percent, height);

    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${current}/${max}`, x + width / 2, y + height + 15);
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

// js/BattleScene.js - 战斗场景
import { Combat } from '../utils/combat.js';
import { heroes } from '../data/characters.js';

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
    this.isAnimating = false;

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
    if (this.battleResult) return;

    const result = await this.combat.executeTurn();

    if (result) {
      this.handleBattleEnd(result);
      return;
    }

    setTimeout(() => {
      this.startBattle();
    }, 1500);
  }

  handleBattleEnd(result) {
    this.battleResult = result;
    this.battleResultText = result === 'win' ? '战斗胜利！' : '战斗失败！';
    this.currentAction = this.battleResultText;
    console.log('战斗结束:', this.battleResultText);
  }

  async onAttack(attacker, target, damage) {
    this.currentAction = `${attacker.name} 攻击 ${target.name}，造成 ${damage} 点伤害`;
    await this.delay(500);
  }

  async onSkill(hero, target, damage) {
    this.currentAction = `${hero.name} 释放 ${hero.skill.name}！造成 ${damage} 点伤害`;
    await this.delay(1000);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  onTouch(x, y) {
    // 检查是否点击重新开始按钮
    if (this.battleResult &&
        x >= this.restartBtn.x && x <= this.restartBtn.x + this.restartBtn.width &&
        y >= this.restartBtn.y && y <= this.restartBtn.y + this.restartBtn.height) {
      this.initBattle();
    }
  }

  update() {
    // 更新逻辑
  }

  render(ctx) {
    // 清空画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制敌方区域
    this.drawEnemyArea(ctx);

    // 绘制战斗信息
    this.drawBattleInfo(ctx);

    // 绘制我方区域
    this.drawMyArea(ctx);
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
    // 卡牌背景
    ctx.fillStyle = hero.currentHp <= 0 ? '#333' : '#16213e';
    ctx.strokeStyle = hero.currentHp <= 0 ? '#555' : '#0f3460';
    ctx.lineWidth = 2;
    this.drawRoundRect(ctx, x, y, width, height, 10);
    ctx.fill();
    ctx.stroke();

    // 角色名
    ctx.fillStyle = hero.currentHp <= 0 ? '#666' : '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(hero.name, x + width / 2, y + 30);

    // 职业标签
    ctx.fillStyle = '#95a5a6';
    ctx.font = '14px Arial';
    ctx.fillText(hero.job, x + width / 2, y + 50);

    // 血条
    this.drawBar(ctx, x + 10, y + 70, width - 20, 15, hero.currentHp, hero.maxHp, '#e74c3c');

    // 蓝条
    this.drawBar(ctx, x + 10, y + 95, width - 20, 15, hero.currentMp, hero.maxMp, '#3498db');
  }

  drawBar(ctx, x, y, width, height, current, max, color) {
    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y, width, height);

    // 进度
    const percent = Math.max(0, current / max);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width * percent, height);

    // 文字
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${current}/${max}`, x + width / 2, y + height + 15);
  }

  drawBattleInfo(ctx) {
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // 回合数
    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`回合: ${this.turn}`, centerX, centerY - 80);

    // 当前行动
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '20px Arial';
    ctx.fillText(this.currentAction, centerX, centerY - 40);

    // 战斗结果
    if (this.battleResult) {
      ctx.fillStyle = this.battleResult === 'win' ? '#2ecc71' : '#e74c3c';
      ctx.font = 'bold 40px Arial';
      ctx.fillText(this.battleResultText, centerX, centerY + 20);

      // 重新开始按钮
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

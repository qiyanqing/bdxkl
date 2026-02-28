// js/map/PlayerRenderer.js
import { heroes } from '../../data/characters.js';

export class PlayerRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.heroImages = {}; // TODO: 加载角色头像
  }

  // 绘制玩家棋子
  drawPlayer(grid, leaderHeroId) {
    const { x, y } = grid;

    this.ctx.save();

    // 绘制棋子阴影
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 25, 20, 10, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fill();

    // 绘制棋子圆形背景
    this.ctx.beginPath();
    this.ctx.arc(x, y, 22, 0, Math.PI * 2);
    this.ctx.fillStyle = '#fff';
    this.ctx.fill();

    // 绘制边框高亮
    this.ctx.strokeStyle = '#ffd700';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    // 绘制角色首字
    const hero = heroes.find(h => h.id === leaderHeroId) || heroes[0];
    const firstChar = hero.name.charAt(0);

    this.ctx.fillStyle = '#e74c3c';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(firstChar, x, y);

    this.ctx.restore();
  }
}

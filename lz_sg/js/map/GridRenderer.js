// js/map/GridRenderer.js
import { gridTypeColors } from './data/level-config.js';

export class GridRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  // 绘制单个格子（2.5D菱形）
  drawGrid(grid, isSelected = false) {
    const { x, y, type, visited } = grid;

    // 菱形格子尺寸
    const gridWidth = 40;  // 半宽
    const gridHeight = 30; // 半高

    this.ctx.save();

    // 绘制菱形格子
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - gridHeight);
    this.ctx.lineTo(x + gridWidth, y);
    this.ctx.lineTo(x, y + gridHeight);
    this.ctx.lineTo(x - gridWidth, y);
    this.ctx.closePath();

    // 填充颜色
    const baseColor = gridTypeColors[type] || '#666';
    this.ctx.fillStyle = visited ? this.darkenColor(baseColor, 0.5) : baseColor;
    this.ctx.fill();

    // 边框
    this.ctx.strokeStyle = isSelected ? '#fff' : 'rgba(255,255,255,0.3)';
    this.ctx.lineWidth = isSelected ? 3 : 1;
    this.ctx.stroke();

    // 绘制格子类型图标（简化为文字）
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.getTypeIcon(type), x, y);

    this.ctx.restore();
  }

  // 获取格子类型图标
  getTypeIcon(type) {
    const icons = {
      battle: '⚔',
      elite: '💀',
      shop: '🏪',
      buff: '⬆',
      event: '?',
      rest: '💚',
      dice: '🎲'
    };
    return icons[type] || '·';
  }

  // 颜色变暗
  darkenColor(color, factor) {
    // 简单处理：已访问格子显示暗色
    return color + '80'; // 添加透明度
  }
}

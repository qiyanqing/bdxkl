// js/map/GridRenderer.js
import { gridTypeColors } from './data/level-config.js';

export class GridRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  // 绘制单个格子（大富翁风格矩形）
  drawGrid(grid, isSelected = false) {
    const { x, y, type, visited, isStart } = grid;

    // 矩形格子尺寸（与gridSize匹配）
    const gridWidth = 70;
    const gridHeight = 50;

    this.ctx.save();

    // 绘制格子背景
    let baseColor = gridTypeColors[type] || '#666';
    // 起点格子使用特殊颜色
    if (isStart) {
      baseColor = '#ffd700'; // 金色
    }
    this.ctx.fillStyle = visited ? this.darkenColor(baseColor, 0.7) : baseColor;
    this.ctx.fillRect(x - gridWidth/2, y - gridHeight/2, gridWidth, gridHeight);

    // 绘制边框
    this.ctx.strokeStyle = isSelected ? '#ffd700' : (isStart ? '#ff8c00' : '#333');
    this.ctx.lineWidth = isSelected || isStart ? 3 : 2;
    this.ctx.strokeRect(x - gridWidth/2, y - gridHeight/2, gridWidth, gridHeight);

    // 绘制格子类型图标
    this.ctx.fillStyle = isStart ? '#333' : '#fff';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(isStart ? '🚩' : this.getTypeIcon(type), x, y - 3);

    // 绘制格子类型文字
    this.ctx.fillStyle = isStart ? '#333' : '#fff';
    this.ctx.font = '9px Arial';
    this.ctx.fillText(isStart ? '起点' : this.getTypeText(type), x, y + 12);

    this.ctx.restore();
  }

  // 获取格子类型文字
  getTypeText(type) {
    const texts = {
      battle: '战斗',
      elite: '精英',
      shop: '商店',
      buff: '强化',
      event: '事件',
      rest: '休息',
      dice: '骰子'
    };
    return texts[type] || '';
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
    // 简单处理：已访问格子显示更深的颜色
    return color.replace('#', '#33');
  }
}

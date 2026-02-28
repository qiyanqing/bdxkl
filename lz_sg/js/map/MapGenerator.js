// js/map/MapGenerator.js
import { levelTemplate, gridTypeNames } from './data/level-config.js';

export class MapGenerator {
  constructor(config, canvasWidth, canvasHeight) {
    this.config = config || levelTemplate;
    this.config.canvasWidth = canvasWidth;
    this.config.canvasHeight = canvasHeight;
  }

  // 生成环形地图路径
  generate() {
    const grids = [];
    const totalGrids = this.config.totalGrids;

    // 生成环形路径坐标
    const path = this.generateRingPath(totalGrids);

    // 分配格子类型
    const types = this.generateGridTypes(totalGrids);

    // 组合数据
    for (let i = 0; i < totalGrids; i++) {
      grids.push({
        index: i,
        x: path[i].x,
        y: path[i].y,
        type: types[i],
        typeName: gridTypeNames[types[i]],
        visited: false
      });
    }

    return grids;
  }

  // 生成环形路径
  generateRingPath(totalGrids) {
    const path = [];
    const centerX = this.config.canvasWidth / 2;
    const centerY = this.config.canvasHeight / 2;
    const radius = 120; // 基础半径

    for (let i = 0; i < totalGrids; i++) {
      // 将格子分布成环形
      const angle = (i / totalGrids) * Math.PI * 2 - Math.PI / 2; // 从顶部开始

      // 2.5D效果：Y轴压缩
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius * 0.6; // 压缩Y轴

      path.push({ x, y });
    }

    return path;
  }

  // 根据概率分布生成格子类型
  generateGridTypes(totalGrids) {
    const types = [];
    const { gridTypes } = this.config;

    // 构建概率池
    const pool = [];
    for (const [type, ratio] of Object.entries(gridTypes)) {
      const count = Math.round(totalGrids * ratio);
      for (let i = 0; i < count; i++) {
        pool.push(type);
      }
    }

    // 补齐或裁剪到精确数量
    while (pool.length < totalGrids) {
      pool.push('battle'); // 默认填充战斗格
    }
    while (pool.length > totalGrids) {
      pool.pop();
    }

    // 随机打乱
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool;
  }
}

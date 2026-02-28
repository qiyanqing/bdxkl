// js/map/MapGenerator.js
import { levelTemplate, gridTypeNames } from './data/level-config.js';

export class MapGenerator {
  constructor(config, canvasWidth, canvasHeight) {
    this.config = config || levelTemplate;
    this.config.canvasWidth = canvasWidth;
    this.config.canvasHeight = canvasHeight;
  }

  // 生成大富翁风格的大地图路径
  generate() {
    const grids = [];
    const totalGrids = this.config.totalGrids;

    // 生成S型曲折路径
    const path = this.generateSnakePath(totalGrids);

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

  // 生成S型大地图路径（超出屏幕尺寸）
  generateSnakePath(totalGrids) {
    const path = [];

    // 地图配置
    const gridSize = 80;      // 格子间距
    const gridWidth = 60;     // 格子宽度
    const gridHeight = 45;    // 格子高度
    const gridsPerRow = 6;    // 每行6个格子
    const rows = Math.ceil(totalGrids / gridsPerRow); // 总行数

    // 计算需要的地图尺寸
    const mapWidth = gridsPerRow * gridSize + 100; // 留边距
    const mapHeight = rows * gridSize + 200;

    // 存储地图尺寸供摄像机使用
    this.config.mapWidth = mapWidth;
    this.config.mapHeight = mapHeight;

    // 生成S型路径
    for (let row = 0; row < rows; row++) {
      const gridsInThisRow = Math.min(gridsPerRow, totalGrids - row * gridsPerRow);

      // 偶数行从左到右，奇数行从右到左
      const isLeftToRight = row % 2 === 0;

      for (let col = 0; col < gridsInThisRow; col++) {
        const actualCol = isLeftToRight ? col : (gridsPerRow - 1 - col);

        const x = 50 + actualCol * gridSize;
        const y = 100 + row * gridSize;

        path.push({ x, y });
      }
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

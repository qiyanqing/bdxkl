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

  // 生成方形折线大富翁地图路径
  generateSnakePath(totalGrids) {
    const path = [];

    // 地图配置
    const gridWidth = 70;     // 格子宽度
    const gridHeight = 50;    // 格子高度

    // 计算需要的地图尺寸
    const mapWidth = 1200; // 固定地图宽度
    const mapHeight = 900;  // 固定地图高度

    // 存储地图尺寸供摄像机使用
    this.config.mapWidth = mapWidth;
    this.config.mapHeight = mapHeight;

    // 起点坐标 - 调整到红框位置（屏幕下方中间）
    const startX = 400; // 调整起点X坐标到红框位置
    const startY = 650; // 调整起点Y坐标到红框位置
    let x = startX;
    let y = startY;

    // 生成方形折线路径 - 每边都有一个简单的Z字形折线，确保格子对齐
    
    // 下边（带Z字形折线）
    // 第一段：向左
    for (let i = 0; i < 4; i++) {
      path.push({ x, y, isStart: i === 0 });
      x -= gridWidth;
    }
    // 第二段：向下（Z字下折）
    y += gridHeight;
    path.push({ x, y });
    // 第三段：向左
    for (let i = 0; i < 3; i++) {
      x -= gridWidth;
      path.push({ x, y });
    }
    // 第四段：向上（Z字上折）
    y -= gridHeight;
    path.push({ x, y });
    // 第五段：向左
    for (let i = 0; i < 3; i++) {
      x -= gridWidth;
      path.push({ x, y });
    }

    // 左边（带Z字形折线）
    // 第一段：向上
    for (let i = 0; i < 4; i++) {
      y -= gridHeight;
      path.push({ x, y });
    }
    // 第二段：向左（Z字左折）
    x -= gridWidth;
    path.push({ x, y });
    // 第三段：向上
    for (let i = 0; i < 3; i++) {
      y -= gridHeight;
      path.push({ x, y });
    }
    // 第四段：向右（Z字右折）
    x += gridWidth;
    path.push({ x, y });
    // 第五段：向上
    for (let i = 0; i < 3; i++) {
      y -= gridHeight;
      path.push({ x, y });
    }

    // 上边（带Z字形折线）
    // 第一段：向右
    for (let i = 0; i < 4; i++) {
      x += gridWidth;
      path.push({ x, y });
    }
    // 第二段：向上（Z字上折）
    y -= gridHeight;
    path.push({ x, y });
    // 第三段：向右
    for (let i = 0; i < 3; i++) {
      x += gridWidth;
      path.push({ x, y });
    }
    // 第四段：向下（Z字下折）
    y += gridHeight;
    path.push({ x, y });
    // 第五段：向右
    for (let i = 0; i < 3; i++) {
      x += gridWidth;
      path.push({ x, y });
    }

    // 右边（带Z字形折线，回到起点）
    // 第一段：向下
    for (let i = 0; i < 4; i++) {
      y += gridHeight;
      path.push({ x, y });
    }
    // 第二段：向右（Z字右折）
    x += gridWidth;
    path.push({ x, y });
    // 第三段：向下
    for (let i = 0; i < 3; i++) {
      y += gridHeight;
      path.push({ x, y });
    }
    // 第四段：向左（Z字左折）
    x -= gridWidth;
    path.push({ x, y });
    // 第五段：向下回到起点
    for (let i = 0; i < 3; i++) {
      y += gridHeight;
      path.push({ x, y });
    }
    // 确保最后一个格子回到起点
    path[path.length - 1] = { x: startX, y: startY, isEnd: true };

    // 确保路径长度正好等于totalGrids
    if (path.length > totalGrids) {
      return path.slice(0, totalGrids);
    } else if (path.length < totalGrids) {
      // 如果路径长度不足，在起点附近添加额外的格子
      while (path.length < totalGrids) {
        path.push({ x: startX, y: startY + (Math.random() * 10 - 5) });
      }
      return path;
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

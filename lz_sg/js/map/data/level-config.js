// js/map/data/level-config.js

// 关卡配置模板
export const levelTemplate = {
  levelId: 1,
  levelName: '第一章-初出茅庐',
  totalGrids: 50,              // 总格子数（方形折线路径）
  totalDice: 35,               // 通关所需骰子数
  forceBattleInterval: 15,     // 强制战斗间隔（骰子数）
  gridTypes: {                 // 格子类型分布比例
    battle: 0.1,       // 10% 普通战斗
    elite: 0.0,        // 0% 精英战斗
    shop: 0.2,         // 20% 商店
    buff: 0.25,        // 25% buff
    event: 0.2,        // 20% 事件
    rest: 0.15,        // 15% 休息
    dice: 0.1          // 10% 骰子格
  }
};

// 格子类型定义
export const gridTypeNames = {
  battle: '普通战斗',
  elite: '精英战斗',
  shop: '商店',
  buff: '强化',
  event: '事件',
  rest: '休息',
  dice: '骰子'
};

// 格子类型颜色配置
export const gridTypeColors = {
  battle: '#e74c3c',
  elite: '#c0392b',
  shop: '#f39c12',
  buff: '#3498db',
  event: '#9b59b6',
  rest: '#2ecc71',
  dice: '#1abc9c'
};

// game-map.js - 地图场景入口
import { MapScene } from './js/map/MapScene.js';

const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');

// 设置画布尺寸
const { windowWidth, windowHeight } = wx.getSystemInfoSync();
canvas.width = windowWidth;
canvas.height = windowHeight;

// 创建地图场景
const mapScene = new MapScene(canvas, windowWidth, windowHeight);

// 初始化场景
mapScene.init();

// 绑定触摸事件
wx.onTouchStart((e) => {
  const touch = e.touches[0];
  mapScene.onTouch(touch.clientX, touch.clientY);
});

console.log('地图场景已启动');

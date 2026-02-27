// js/Game.js - 游戏主类
import { BattleScene } from './BattleScene.js';
import { StartScene } from './StartScene.js';
import { heroes } from '../data/characters.js';

export class Game {
  constructor() {
    this.canvas = wx.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // 游戏状态
    this.state = 'start'; // start, battle
    this.currentScene = null;

    // 触摸事件
    this.bindEvents();
  }

  init() {
    console.log('游戏初始化');

    // 初始化云开发
    this.initCloud();

    // 显示启动场景
    this.showStartScene();
  }

  // 初始化云开发
  initCloud() {
    if (!wx.cloud) {
      console.log('云开发不可用');
      return;
    }

    wx.cloud.init({
      env: 'your-env-id', // 请替换为你的云环境ID
      traceUser: true
    });

    console.log('云开发初始化完成');
  }

  // 显示启动场景
  showStartScene() {
    this.state = 'start';
    this.currentScene = new StartScene(this);
    this.currentScene.init();
  }

  // 显示战斗场景
  showBattleScene() {
    this.state = 'battle';
    this.currentScene = new BattleScene(this);
    this.currentScene.init();
  }

  // 绑定触摸事件
  bindEvents() {
    wx.onTouchStart(this.handleTouchStart.bind(this));
  }

  handleTouchStart(res) {
    const touch = res.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    if (this.currentScene && this.currentScene.onTouch) {
      this.currentScene.onTouch(x, y);
    }
  }

  // 游戏主循环
  update() {
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update();
    }
  }

  // 渲染
  render() {
    // 清空画布
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.currentScene && this.currentScene.render) {
      this.currentScene.render(this.ctx);
    }
  }
}

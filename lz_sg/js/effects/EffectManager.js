// js/effects/EffectManager.js - 特效管理器
import { SlashEffect } from './SlashEffect.js';
import { BeamEffect } from './BeamEffect.js';
import { DamageNumber } from './DamageNumber.js';

export class EffectManager {
  constructor(ctx) {
    this.ctx = ctx;
    this.effects = []; // 活跃的特效列表
  }

  // 添加特效
  addEffect(effect) {
    this.effects.push(effect);
  }

  // 创建近战刀光特效
  createSlashEffect(fromX, fromY, toX, toY, color = '#FFD700') {
    const effect = new SlashEffect(fromX, fromY, toX, toY, color);
    this.addEffect(effect);
  }

  // 创建远程光束特效
  createBeamEffect(fromX, fromY, toX, toY, color = '#3498DB') {
    const effect = new BeamEffect(fromX, fromY, toX, toY, color);
    this.addEffect(effect);
  }

  // 创建伤害飘字
  createDamageNumber(x, y, damage, isSkill = false) {
    const effect = new DamageNumber(x, y, damage, isSkill);
    this.addEffect(effect);
  }

  // 更新所有特效
  update() {
    // 更新并移除已完成的特效
    this.effects = this.effects.filter(effect => {
      effect.update();
      return !effect.isComplete();
    });
  }

  // 渲染所有特效
  render() {
    this.effects.forEach(effect => {
      effect.render(this.ctx);
    });
  }

  // 清空所有特效
  clear() {
    this.effects = [];
  }
}

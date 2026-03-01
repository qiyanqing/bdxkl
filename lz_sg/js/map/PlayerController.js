// js/map/PlayerController.js
export class PlayerController {
  constructor(levelState) {
    this.levelState = levelState;
    this.currentPosition = 0;
    this.targetPosition = 0;
    this.isMoving = false;
  }

  // 投掷骰子
  rollDice() {
    // 检查是否有幸运币道具
    if (this.levelState.inventory.luckyCoins > 0) {
      this.levelState.inventory.luckyCoins--;
      return 6;
    }

    // 检查是否有最小骰子道具
    if (this.levelState.inventory.minDice > 0) {
      this.levelState.inventory.minDice--;
      return 1;
    }

    // 普通随机投掷
    return Math.floor(Math.random() * 6) + 1;
  }

  // 计算目标位置
  calculateTargetPosition(steps) {
    // 检查双倍骰子
    if (this.levelState.inventory.doubleDice > 0) {
      this.levelState.inventory.doubleDice--;
      steps *= 2;
    }

    return steps;
  }

  // 移动到目标位置
  moveTo(targetPosition) {
    this.targetPosition = targetPosition;
    this.isMoving = true;
  }

  // 更新位置（动画用）
  update() {
    if (!this.isMoving) return false;

    // 简单移动逻辑
    if (this.currentPosition < this.targetPosition) {
      this.currentPosition++;
    } else if (this.currentPosition > this.targetPosition) {
      this.currentPosition = (this.currentPosition + 1) % this.levelState.totalGrids || 15;
    } else {
      this.isMoving = false;
      return true; // 移动完成
    }

    return false;
  }

  // 更新关卡状态
  updateLevelState(steps) {
    this.levelState.diceUsed++;
    this.levelState.diceRemaining--;
    this.levelState.totalSteps += steps;
  }
}

// 战斗逻辑核心
export class Combat {
  constructor(myHeroes, enemyHeroes) {
    this.myHeroes = myHeroes;      // 我方角色
    this.enemyHeroes = enemyHeroes; // 敌方角色
    this.turnQueue = [];           // 行动队列
    this.currentTurn = 0;
    this.onAttack = null;          // 攻击回调
    this.onSkill = null;           // 技能回调
    this.onBattleEnd = null;       // 战斗结束回调
  }

  // 初始化战斗
  init() {
    // 合并双方角色，按速度排序
    const allHeroes = [...this.myHeroes, ...this.enemyHeroes];
    this.turnQueue = allHeroes.sort((a, b) => b.speed - a.speed);
    console.log('行动队列:', this.turnQueue.map(h => h.name));
  }

  // 执行一回合
  async executeTurn() {
    const hero = this.turnQueue[this.currentTurn];

    // 判断是否存活
    if (hero.currentHp <= 0) {
      this.currentTurn++;
      return null;
    }

    // 选择目标（AI逻辑）
    const target = this.selectTarget(hero);
    if (!target) {
      // 没有可用目标，战斗结束
      return this.checkBattleEnd();
    }

    // 执行攻击
    await this.attack(hero, target);

    // 回蓝
    hero.currentMp = Math.min(hero.maxMp, hero.currentMp + hero.mpRecovery);

    // 检查蓝条是否满，满则释放大招
    if (hero.currentMp >= hero.maxMp) {
      await this.useSkill(hero, target);
    }

    // 检查战斗结束
    const result = this.checkBattleEnd();
    if (result) {
      return result;
    }

    // 下一回合
    this.currentTurn = (this.currentTurn + 1) % this.turnQueue.length;
    return null;
  }

  // 选择目标（简化AI：攻击血量最少的敌人）
  selectTarget(attacker) {
    const isMyTeam = this.myHeroes.includes(attacker);
    const enemies = isMyTeam ? this.enemyHeroes : this.myHeroes;

    // 找存活且血量最少的敌人
    const aliveEnemies = enemies.filter(e => e.currentHp > 0);
    if (aliveEnemies.length === 0) {
      return null;
    }

    return aliveEnemies.reduce((min, enemy) =>
      enemy.currentHp < min.currentHp ? enemy : min
    );
  }

  // 普通攻击
  async attack(attacker, target) {
    const damage = Math.max(1, attacker.atk - target.def);
    target.currentHp = Math.max(0, target.currentHp - damage);

    console.log(`${attacker.name} 攻击 ${target.name}，造成 ${damage} 点伤害`);

    // 触发UI回调
    if (this.onAttack) {
      await this.onAttack(attacker, target, damage);
    }
  }

  // 释放技能
  async useSkill(hero, target) {
    const damage = Math.floor(hero.atk * hero.skill.damage - target.def);
    target.currentHp = Math.max(0, target.currentHp - damage);
    hero.currentMp = 0; // 消耗全部蓝量

    console.log(`${hero.name} 释放 ${hero.skill.name}！造成 ${damage} 点伤害`);

    // 触发UI回调
    if (this.onSkill) {
      await this.onSkill(hero, target, damage);
    }
  }

  // 检查战斗是否结束
  checkBattleEnd() {
    const myAlive = this.myHeroes.filter(h => h.currentHp > 0).length;
    const enemyAlive = this.enemyHeroes.filter(h => h.currentHp > 0).length;

    if (myAlive === 0) {
      return 'lose';
    }
    if (enemyAlive === 0) {
      return 'win';
    }
    return null;
  }

  // 获取战斗结果
  getBattleResult() {
    const myAlive = this.myHeroes.filter(h => h.currentHp > 0).length;
    return myAlive > 0 ? 'win' : 'lose';
  }
}

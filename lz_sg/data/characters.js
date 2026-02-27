// 角色数据
export const heroes = [
  {
    id: 'guan_yu',
    name: '关羽',
    job: 'warrior',      // 战士
    rarity: 'gold',      // 稀有度
    maxHp: 1200,         // 血量
    atk: 150,            // 攻击力
    def: 50,             // 防御力
    speed: 80,           // 速度
    maxMp: 100,          // 蓝量上限
    mpRecovery: 10,      // 普攻回蓝
    image: 'assets/images/characters/guan_yu.png',  // 立绘路径
    skill: {
      name: '青龙偃月斩',
      costMp: 100,
      damage: 2.5        // 250%攻击伤害
    }
  },
  {
    id: 'zhang_fei',
    name: '张飞',
    job: 'tank',         // 坦克
    rarity: 'purple',    // 稀有度
    maxHp: 1800,
    atk: 100,
    def: 100,
    speed: 50,
    maxMp: 100,
    mpRecovery: 10,
    image: 'assets/images/characters/zhang_fei.png',
    skill: {
      name: '狮吼功',
      costMp: 100,
      damage: 2.0
    }
  },
  {
    id: 'huang_zhong',
    name: '黄忠',
    job: 'archer',       // 射手
    rarity: 'blue',      // 稀有度
    maxHp: 800,
    atk: 200,
    def: 30,
    speed: 90,
    maxMp: 100,
    mpRecovery: 10,
    image: 'assets/images/characters/huang_zhong.png',
    skill: {
      name: '百步穿杨',
      costMp: 100,
      damage: 3.0
    }
  },
  {
    id: 'zhao_yun',
    name: '赵云',
    job: 'warrior',      // 战士
    rarity: 'gold',      // 稀有度
    maxHp: 1300,
    atk: 160,
    def: 60,
    speed: 95,
    maxMp: 100,
    mpRecovery: 10,
    image: 'assets/images/characters/zhao_yun.png',
    skill: {
      name: '龙胆亮银枪',
      costMp: 100,
      damage: 2.6
    }
  },
  {
    id: 'lu_bu',
    name: '吕布',
    job: 'assassin',     // 刺客
    rarity: 'gold',      // 稀有度
    maxHp: 1000,
    atk: 220,
    def: 40,
    speed: 100,
    maxMp: 100,
    mpRecovery: 10,
    image: 'assets/images/characters/lu_bu.png',
    skill: {
      name: '无双斩',
      costMp: 100,
      damage: 3.5
    }
  },
  {
    id: 'diaochan',
    name: '貂蝉',
    job: 'support',      // 辅助
    rarity: 'gold',      // 稀有度
    maxHp: 900,
    atk: 80,
    def: 40,
    speed: 85,
    maxMp: 100,
    mpRecovery: 10,
    image: 'assets/images/characters/diaochan.png',
    skill: {
      name: '闭月羞花',
      costMp: 100,
      damage: 1.8
    }
  }
];

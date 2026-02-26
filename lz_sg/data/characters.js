// 角色数据
module.exports = {
  heroes: [
    {
      id: 'guan_yu',
      name: '关羽',
      job: 'warrior',      // 战士
      maxHp: 1200,         // 血量
      atk: 150,            // 攻击力
      def: 50,             // 防御力
      speed: 80,           // 速度
      maxMp: 100,          // 蓝量上限
      mpRecovery: 10,      // 普攻回蓝
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
      maxHp: 1800,
      atk: 100,
      def: 100,
      speed: 50,
      maxMp: 100,
      mpRecovery: 10,
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
      maxHp: 800,
      atk: 200,
      def: 30,
      speed: 90,
      maxMp: 100,
      mpRecovery: 10,
      skill: {
        name: '百步穿杨',
        costMp: 100,
        damage: 3.0
      }
    }
  ]
}

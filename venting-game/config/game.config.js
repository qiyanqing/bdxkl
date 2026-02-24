// config/game.config.js

/**
 * 技能配置
 */
const SKILL_CONFIG = {
  // 物理攻击
  slap: {
    id: 'slap',
    name: '扇耳手',
    damage: 10,
    cd: 0,
    category: 'physical',
    icon: '/assets/icons/slap.png'
  },
  punch: {
    id: 'punch',
    name: '拳打',
    damage: 30,
    cd: 1000,
    category: 'physical',
    icon: '/assets/icons/punch.png'
  },
  kick: {
    id: 'kick',
    name: '飞踢',
    damage: 50,
    cd: 3000,
    category: 'physical',
    icon: '/assets/icons/kick.png'
  },

  // 道具攻击
  throw_egg: {
    id: 'throw_egg',
    name: '扔鸡蛋',
    damage: 20,
    cd: 2000,
    category: 'item',
    icon: '/assets/icons/egg.png'
  },
  splash: {
    id: 'splash',
    name: '泼水',
    damage: 25,
    cd: 2000,
    category: 'item',
    icon: '/assets/icons/water.png'
  },
  throw_shoe: {
    id: 'throw_shoe',
    name: '扔鞋子',
    damage: 60,
    cd: 4000,
    category: 'item',
    icon: '/assets/icons/shoe.png'
  },

  // 魔法攻击
  fireball: {
    id: 'fireball',
    name: '火球术',
    damage: 40,
    cd: 3000,
    category: 'magic',
    icon: '/assets/icons/fire.png'
  },
  lightning: {
    id: 'lightning',
    name: '雷击',
    damage: 80,
    cd: 5000,
    category: 'magic',
    icon: '/assets/icons/lightning.png'
  },
  freeze: {
    id: 'freeze',
    name: '冰冻',
    damage: 70,
    cd: 4000,
    category: 'magic',
    icon: '/assets/icons/ice.png'
  },

  // 言语攻击
  text_barrage: {
    id: 'text_barrage',
    name: '弹幕吐槽',
    damage: 15,
    cd: 0,
    category: 'speech',
    icon: '/assets/icons/text.png'
  },
  voice: {
    id: 'voice',
    name: '语音喊话',
    damage: 35,
    cd: 5000,
    category: 'speech',
    icon: '/assets/icons/voice.png'
  },
  text_bomb: {
    id: 'text_bomb',
    name: '文字轰炸',
    damage: 50,
    cd: 8000,
    category: 'speech',
    icon: '/assets/icons/bomb.png'
  }
}

/**
 * 技能分类（用于UI展示）
 */
const SKILL_CATEGORIES = {
  physical: {
    name: '物理攻击',
    skills: ['slap', 'punch', 'kick']
  },
  item: {
    name: '道具攻击',
    skills: ['throw_egg', 'splash', 'throw_shoe']
  },
  magic: {
    name: '魔法攻击',
    skills: ['fireball', 'lightning', 'freeze']
  },
  speech: {
    name: '言语攻击',
    skills: ['text_barrage', 'voice', 'text_bomb']
  }
}

/**
 * 分享触发阈值
 */
const SHARE_THRESHOLD = {
  perSkill: 100,    // 单技能触发次数
  perTotal: 100     // 总攻击触发次数
}

/**
 * 卡通角色配置
 * 发泄主题角色
 */
const CARTOON_CHARS = {
  male: [
    { id: 'm1', name: '油腻大叔', emoji: '👨‍🦲', preview: '👨‍🦲' },
    { id: 'm2', name: '极品同事', emoji: '👔', preview: '👔' },
    { id: 'm3', name: '啰嗦上司', emoji: '🤵', preview: '🤵' },
    { id: 'm4', name: '杠精大哥', emoji: '😤', preview: '😤' },
    { id: 'm5', name: '催婚亲戚', emoji: '👵', preview: '👵' }
  ],
  female: [
    { id: 'f1', name: '八爪鱼', emoji: '👩', preview: '👩' },
    { id: 'f2', name: '麻烦精', emoji: '💁‍♀️', preview: '💁‍♀️' },
    { id: 'f3', name: '催婚阿姨', emoji: '👩‍🦳', preview: '👩‍🦳' },
    { id: 'f4', name: '键盘侠', emoji: '👩‍💻', preview: '👩‍💻' },
    { id: 'f5', name: '甩锅王', emoji: '🙅‍♀️', preview: '🙅‍♀️' }
  ]
}

module.exports = {
  SKILL_CONFIG,
  SKILL_CATEGORIES,
  SHARE_THRESHOLD,
  CARTOON_CHARS
}

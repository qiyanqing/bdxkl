// js/data/gachaPool.js - 抽卡卡池配置

/**
 * 稀有度定义
 */
export const Rarity = {
  UR: 'UR',  // 金卡 - Ultra Rare
  SSR: 'SSR', // 紫卡 - Super Super Rare
  R: 'R',     // 蓝卡 - Rare
};

/**
 * 稀有度颜色
 */
export const RarityColors = {
  UR: '#f1c40f',    // 金色
  SSR: '#a855f7',   // 紫色
  R: '#3b82f6',     // 蓝色
};

/**
 * 稀有度概率配置
 */
export const GachaRates = {
  UR: 0.05,   // 5%
  SSR: 0.15,  // 15%
  R: 0.80,    // 80%
};

/**
 * 保底配置
 */
export const PityConfig = {
  urPity: 90,   // 金卡保底：90抽
  ssrPity: 10,  // 紫卡保底：10抽
};

/**
 * 角色卡池数据
 * 后续可从服务器获取
 */
export const CharacterPool = {
  // 金卡池 (UR)
  UR: [
    { id: 'lubu', name: '吕布', faction: '群', avatar: '⚔️' },
    { id: 'zhugeliang', name: '诸葛亮', faction: '蜀', avatar: '🪶' },
    { id: 'simayi', name: '司马懿', faction: '魏', avatar: '📜' },
    { id: 'zhouyu', name: '周瑜', faction: '吴', avatar: '🔥' },
    { id: 'guanyu', name: '关羽', faction: '蜀', avatar: '🐉' },
    { id: 'zhangfei', name: '张飞', faction: '蜀', avatar: '😤' },
    { id: 'zhaoyun', name: '赵云', faction: '蜀', avatar: '💨' },
    { id: 'machao', name: '马超', faction: '蜀', avatar: '🐎' },
    { id: 'huangzhong', name: '黄忠', faction: '蜀', avatar: '🏹' },
    { id: 'caocao', name: '曹操', faction: '魏', avatar: '👑' },
  ],

  // 紫卡池 (SSR)
  SSR: [
    { id: 'weiyan', name: '魏延', faction: '蜀', avatar: '⚔️' },
    { id: 'jiangwei', name: '姜维', faction: '蜀', avatar: '🛡️' },
    { id: 'dianwei', name: '典韦', faction: '魏', avatar: '💪' },
    { id: 'xuchu', name: '许褚', faction: '魏', avatar: '🪨' },
    { id: 'ganning', name: '甘宁', faction: '吴', avatar: '🏴‍☠️' },
    { id: 'taishici', name: '太史慈', faction: '吴', avatar: '🎯' },
    { id: 'sunce', name: '孙策', faction: '吴', avatar: '🔱' },
    { id: 'zhoucang', name: '周仓', faction: '蜀', avatar: '📦' },
    { id: 'liao_hua', name: '廖化', faction: '蜀', avatar: '⚡' },
    { id: 'guojia', name: '郭嘉', faction: '魏', avatar: '📖' },
    { id: 'xiahoudun', name: '夏侯惇', faction: '魏', avatar: '👁️' },
    { id: 'zhangliao', name: '张辽', faction: '魏', avatar: '🌙' },
    { id: 'huanggai', name: '黄盖', faction: '吴', avatar: '🔨' },
    { id: 'chengpu', name: '程普', faction: '吴', avatar: '🚩' },
    { id: 'lvbu', name: '吕蒙', faction: '吴', avatar: '📚' },
  ],

  // 蓝卡池 (R)
  R: [
    { id: 'liaodong', name: '廖化', faction: '蜀', avatar: '⚔️' },
    { id: 'wangping', name: '王平', faction: '蜀', avatar: '🛡️' },
    { id: 'zhangyi', name: '张翼', faction: '蜀', avatar: '🏹' },
    { id: 'mazhong', name: '马忠', faction: '蜀', avatar: '🐎' },
    { id: 'liming', name: '李严', faction: '蜀', avatar: '⚖️' },
    { id: 'yuanxi', name: '袁绍', faction: '群', avatar: '🏴' },
    { id: 'gongsunzan', name: '公孙瓒', faction: '群', avatar: '🐴' },
    { id: 'han_sui', name: '韩遂', faction: '群', avatar: '🗡️' },
    { id: 'mateng', name: '马腾', faction: '群', avatar: '🔥' },
    { id: 'zhangxiu', name: '张绣', faction: '群', avatar: '💫' },
  ],
};

/**
 * 根据稀有度获取随机角色
 */
export function getRandomCharacter(rarity) {
  const pool = CharacterPool[rarity];
  if (!pool || pool.length === 0) {
    return null;
  }
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * 根据角色ID获取角色信息
 */
export function getCharacterById(characterId) {
  for (const rarity of Object.keys(CharacterPool)) {
    const character = CharacterPool[rarity].find(c => c.id === characterId);
    if (character) {
      return { ...character, rarity };
    }
  }
  return null;
}

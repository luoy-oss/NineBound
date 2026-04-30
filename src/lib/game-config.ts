// 战斗配置
export const BATTLE_CONFIG = {
  basePlayerHp: 1000,
  basePlayerAtk: 50,
  baseEnemyHp: 200,
  baseEnemyAtk: 20,
  enemyHpScale: 1.15, // 每层血量增长
  enemyAtkScale: 1.1, // 每层攻击增长
  eliteHpMult: 5,
  eliteAtkMult: 2,
  bossHpMult: 20,
  bossAtkMult: 5,
  battleTickMs: 500, // 战斗刷新间隔
  playerAttackInterval: 2, // 玩家每2tick攻击一次
};

// 技能配置
export const SKILLS = [
  {
    id: "slash",
    name: "星裂斩",
    cooldown: 5,
    damageMult: 3,
    description: "对敌人造成3倍攻击伤害",
    unlockFloor: 1,
  },
  {
    id: "heal",
    name: "锚点之光",
    cooldown: 10,
    healPercent: 0.3,
    description: "恢复30%生命值",
    unlockFloor: 10,
  },
  {
    id: "burst",
    name: "玖爆",
    cooldown: 15,
    damageMult: 8,
    description: "对敌人造成8倍攻击伤害",
    unlockFloor: 30,
  },
];

// Buff配置（每5层可选）
export const BUFFS = [
  { id: "atk_up", name: "攻击强化", desc: "攻击+10%", apply: (p: any) => (p.atk *= 1.1) },
  { id: "hp_up", name: "生命强化", desc: "生命+10%", apply: (p: any) => (p.maxHp *= 1.1) },
  { id: "crit_up", name: "暴击强化", desc: "暴击率+5%", apply: (p: any) => (p.critRate = (p.critRate || 0.05) + 0.05) },
  { id: "def_up", name: "防御强化", desc: "减伤+5%", apply: (p: any) => (p.damageReduce = (p.damageReduce || 0) + 0.05) },
];

// 奖励配置
export const REWARDS = {
  coinsPerFloor: (floor: number) => floor * 10,
  eliteCoinsMult: 3,
  bossCoinsMult: 5,
};

// 敌人名称
export const ENEMY_NAMES = {
  normal: ["虚空游荡者", "星际拾荒虫", "暗物质残影", "裂隙爬行者", "星尘幽灵"],
  elite: ["精英·虚空猎手", "精英·碎星者", "精英·暗能吞噬者"],
  boss: ["Boss·深渊领主", "Boss·星河毁灭者", "Boss·虚无之王"],
};

// 洛玖台词
export const LUOJIU_LINES: Record<string, string> = {
  first_login: "指挥官，我是洛玖。锚点已失，但我们还没输。",
  floor_10: "丧家之犬？让他们看看谁才是宇宙的灾厄。",
  floor_50: "坐标碎片已解析12%，继续前进。",
  floor_100: "地球在呼唤，我们能听到。",
  floor_500: "你已经成为宇宙的传说，但地球还在等你。",
  fail: "休整一下，锚点的光芒不会熄灭。",
  token: "把这个交给群里的我，我会帮你处理。",
  idle: "随时待命，指挥官。",
};

// 装备池
export const EQUIPMENT_POOL = {
  common: [
    { id: "rusty_blade", name: "锈蚀星刃", type: "weapon", atkBonus: 10, rarity: "common" },
    { id: "scrap_armor", name: "残破护甲", type: "armor", hpBonus: 50, rarity: "common" },
    { id: "crystal_shard", name: "碎片吊坠", type: "accessory", atkBonus: 5, hpBonus: 20, rarity: "common" },
  ],
  rare: [
    { id: "void_blade", name: "虚空之刃", type: "weapon", atkBonus: 30, rarity: "rare" },
    { id: "star_armor", name: "星河战甲", type: "armor", hpBonus: 150, rarity: "rare" },
    { id: "anchor_ring", name: "锚点之戒", type: "accessory", atkBonus: 15, hpBonus: 80, rarity: "rare" },
  ],
  epic: [
    { id: "nine_sword", name: "玖天裂空剑", type: "weapon", atkBonus: 80, rarity: "epic" },
    { id: "earth_shield", name: "地球遗盾", type: "armor", hpBonus: 400, rarity: "epic" },
    { id: "home_pendant", name: "归乡坠饰", type: "accessory", atkBonus: 40, hpBonus: 200, rarity: "epic" },
  ],
};

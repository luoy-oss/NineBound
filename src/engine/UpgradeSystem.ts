import { PlayerStats, UpgradeOption, ShopItem } from "./types";

const UPGRADE_POOL: UpgradeOption[] = [
  { id: "atk_1", name: "攻击强化 I", description: "攻击力 +15%", icon: "⚔️", rarity: "common",
    apply: s => ({ ...s, atk: s.atk * 1.15 }) },
  { id: "atk_2", name: "攻击强化 II", description: "攻击力 +25%", icon: "🗡️", rarity: "rare",
    apply: s => ({ ...s, atk: s.atk * 1.25 }) },
  { id: "atkspd", name: "急速射击", description: "攻击速度 +20%", icon: "🏹", rarity: "common",
    apply: s => ({ ...s, atkSpeed: s.atkSpeed * 1.2 }) },
  { id: "hp_1", name: "生命强化 I", description: "最大生命 +20%", icon: "❤️", rarity: "common",
    apply: s => ({ ...s, maxHp: s.maxHp * 1.2 }) },
  { id: "hp_2", name: "生命强化 II", description: "最大生命 +35%", icon: "💖", rarity: "rare",
    apply: s => ({ ...s, maxHp: s.maxHp * 1.35 }) },
  { id: "armor", name: "护甲强化", description: "护甲 +8", icon: "🛡️", rarity: "common",
    apply: s => ({ ...s, armor: s.armor + 8 }) },
  { id: "regen", name: "生命回复", description: "每秒回复 +3", icon: "💚", rarity: "rare",
    apply: s => ({ ...s, hpRegen: s.hpRegen + 3 }) },
  { id: "crit_rate", name: "暴击率强化", description: "暴击率 +8%", icon: "🎯", rarity: "common",
    apply: s => ({ ...s, critRate: Math.min(0.8, s.critRate + 0.08) }) },
  { id: "crit_dmg", name: "暴击伤害强化", description: "暴击倍率 +0.3", icon: "💥", rarity: "rare",
    apply: s => ({ ...s, critMult: s.critMult + 0.3 }) },
  { id: "move", name: "机动强化", description: "移动速度 +15%", icon: "👟", rarity: "common",
    apply: s => ({ ...s, moveSpeed: s.moveSpeed * 1.15 }) },
  { id: "pierce", name: "穿透射击", description: "子弹穿透 +1", icon: "🔮", rarity: "rare",
    apply: s => ({ ...s, pierce: s.pierce + 1 }) },
  { id: "multishot", name: "多重射击", description: "同时发射 +1 发子弹", icon: "🌟", rarity: "epic",
    apply: s => ({ ...s, multishot: s.multishot + 1 }) },
  { id: "lifesteal", name: "生命窃取", description: "造成伤害的 3% 回复生命", icon: "🧛", rarity: "epic",
    apply: s => ({ ...s, lifeSteal: s.lifeSteal + 0.03 }) },
  { id: "atk_3", name: "攻击强化 III", description: "攻击力 +40%", icon: "🔥", rarity: "epic",
    apply: s => ({ ...s, atk: s.atk * 1.4 }) },
  { id: "all_stats", name: "玖之祝福", description: "全属性 +10%", icon: "✨", rarity: "legendary",
    apply: s => ({
      ...s, atk: s.atk * 1.1, maxHp: s.maxHp * 1.1,
      atkSpeed: s.atkSpeed * 1.1, moveSpeed: s.moveSpeed * 1.1,
    }) },
];

const SHOP_POOL: ShopItem[] = [
  { id: "s_atk1", name: "战斗芯片 MK-I", description: "攻击力 +50", icon: "💾", cost: 100, rarity: "common",
    apply: s => ({ ...s, atk: s.atk + 50 }) },
  { id: "s_atk2", name: "战斗芯片 MK-II", description: "攻击力 +120", icon: "💿", cost: 300, rarity: "rare",
    apply: s => ({ ...s, atk: s.atk + 120 }) },
  { id: "s_hp", name: "生命模块", description: "最大生命 +300", icon: "🔋", cost: 150, rarity: "common",
    apply: s => ({ ...s, maxHp: s.maxHp + 300 }) },
  { id: "s_crit", name: "精准瞄准器", description: "暴击率 +12%", icon: "🔭", cost: 250, rarity: "rare",
    apply: s => ({ ...s, critRate: Math.min(0.8, s.critRate + 0.12) }) },
  { id: "s_speed", name: "推进器", description: "移动速度 +25%", icon: "🚀", cost: 200, rarity: "rare",
    apply: s => ({ ...s, moveSpeed: s.moveSpeed * 1.25 }) },
  { id: "s_regen", name: "修复纳米虫", description: "每秒回复 +10", icon: "🩹", cost: 180, rarity: "common",
    apply: s => ({ ...s, hpRegen: s.hpRegen + 10 }) },
  { id: "s_pierce", name: "穿透弹头", description: "子弹穿透 +2", icon: "💫", cost: 350, rarity: "epic",
    apply: s => ({ ...s, pierce: s.pierce + 2 }) },
  { id: "s_legendary", name: "玖核心", description: "全属性 +20%", icon: "🌌", cost: 800, rarity: "legendary",
    apply: s => ({
      ...s, atk: s.atk * 1.2, maxHp: s.maxHp * 1.2,
      atkSpeed: s.atkSpeed * 1.2, moveSpeed: s.moveSpeed * 1.2,
    }) },
];

export class UpgradeSystem {
  getRandomUpgrades(count: number = 3, excludeIds: string[] = []): UpgradeOption[] {
    const available = UPGRADE_POOL.filter(u => !excludeIds.includes(u.id));
    // Weight by rarity
    const weighted: { item: UpgradeOption; weight: number }[] = available.map(u => ({
      item: u,
      weight: u.rarity === "legendary" ? 1 : u.rarity === "epic" ? 3 : u.rarity === "rare" ? 6 : 10,
    }));

    const selected: UpgradeOption[] = [];
    const pool = [...weighted];

    for (let i = 0; i < Math.min(count, pool.length); i++) {
      const totalWeight = pool.reduce((s, w) => s + w.weight, 0);
      let r = Math.random() * totalWeight;
      for (let j = 0; j < pool.length; j++) {
        r -= pool[j].weight;
        if (r <= 0) {
          selected.push(pool[j].item);
          pool.splice(j, 1);
          break;
        }
      }
    }

    return selected;
  }

  getShopItems(floor: number): ShopItem[] {
    // Price scaling per shop visit
    const shopVisit = Math.floor(floor / 5);
    const scale = 1 + shopVisit * 0.2;

    // Pick 4-6 random items
    const shuffled = [...SHOP_POOL].sort(() => Math.random() - 0.5);
    const count = Math.min(6, shuffled.length);
    return shuffled.slice(0, count).map(item => ({
      ...item,
      cost: Math.floor(item.cost * scale),
    }));
  }

  applyUpgrade(upgrade: UpgradeOption, stats: PlayerStats): PlayerStats {
    return upgrade.apply({ ...stats });
  }
}

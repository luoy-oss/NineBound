import { GAME } from "./constants";
import type { EnemyTemplate, FloorReward } from "@/types/game";
import type { Equipment } from "@/types/database";
import { randomUUID } from "crypto";

export function generateEnemy(floor: number): EnemyTemplate {
  const qualitativeTier = Math.floor(floor / GAME.QUALITATIVE_UPGRADE_INTERVAL);
  const scale = Math.pow(GAME.HP_SCALE_PER_FLOOR, floor - 1);
  const qualScale = Math.pow(GAME.QUALITATIVE_HP_JUMP, qualitativeTier);

  const baseHp = GAME.BASE_ENEMY_HP * scale * qualScale;
  const baseAttack = 10 * scale * Math.pow(GAME.QUALITATIVE_DAMAGE_JUMP, qualitativeTier);

  const isBoss = floor > 0 && floor % GAME.BOSS_INTERVAL === 0;
  const isElite = !isBoss && floor > 0 && floor % GAME.ELITE_INTERVAL === 0;

  if (isBoss) {
    return {
      name: `第${floor}层 · 星际领主`,
      baseHp: baseHp * GAME.BOSS_HP_MULTIPLIER,
      baseAttack: baseAttack * GAME.BOSS_DAMAGE_MULTIPLIER,
      baseDefense: 5 * qualitativeTier + 10,
      isElite: false,
      isBoss: true,
    };
  }

  if (isElite) {
    return {
      name: `第${floor}层 · 精英守卫`,
      baseHp: baseHp * GAME.ELITE_HP_MULTIPLIER,
      baseAttack: baseAttack * GAME.ELITE_DAMAGE_MULTIPLIER,
      baseDefense: 3 * qualitativeTier + 5,
      isElite: true,
      isBoss: false,
    };
  }

  const enemyNames = ["虚空游荡者", "星尘爬虫", "暗影斥候", "裂隙残影", "深渊哨兵"];
  return {
    name: enemyNames[floor % enemyNames.length],
    baseHp,
    baseAttack,
    baseDefense: 2 * qualitativeTier + 1,
    isElite: false,
    isBoss: false,
  };
}

interface EquipmentTemplate {
  name: string;
  type: "weapon" | "armor" | "accessory";
  stats: { attack: number; defense: number; hp: number; speed: number };
}

const EQUIPMENT_POOL: Record<string, EquipmentTemplate[]> = {
  common: [
    { name: "锈蚀短刀", type: "weapon", stats: { attack: 5, defense: 0, hp: 0, speed: 0 } },
    { name: "破旧护甲", type: "armor", stats: { attack: 0, defense: 5, hp: 0, speed: 0 } },
    { name: "黯淡指环", type: "accessory", stats: { attack: 0, defense: 0, hp: 20, speed: 0 } },
  ],
  uncommon: [
    { name: "星辉之刃", type: "weapon", stats: { attack: 12, defense: 0, hp: 0, speed: 0 } },
    { name: "虚空胸甲", type: "armor", stats: { attack: 0, defense: 12, hp: 0, speed: 0 } },
    { name: "引力吊坠", type: "accessory", stats: { attack: 3, defense: 0, hp: 50, speed: 0 } },
  ],
  rare: [
    { name: "灭星者", type: "weapon", stats: { attack: 25, defense: 0, hp: 0, speed: 5 } },
    { name: "黑洞战甲", type: "armor", stats: { attack: 0, defense: 25, hp: 100, speed: 0 } },
    { name: "坐标碎片", type: "accessory", stats: { attack: 10, defense: 10, hp: 80, speed: 0 } },
  ],
  epic: [
    { name: "因果律武器", type: "weapon", stats: { attack: 50, defense: 0, hp: 0, speed: 10 } },
    { name: "时空壁垒", type: "armor", stats: { attack: 0, defense: 50, hp: 200, speed: 0 } },
    { name: "玖之徽记", type: "accessory", stats: { attack: 20, defense: 20, hp: 150, speed: 0 } },
  ],
  legendary: [
    { name: "地球锚点碎片", type: "weapon", stats: { attack: 100, defense: 0, hp: 0, speed: 20 } },
    { name: "文明遗骸", type: "armor", stats: { attack: 0, defense: 100, hp: 500, speed: 0 } },
    { name: "归乡之钥", type: "accessory", stats: { attack: 40, defense: 40, hp: 300, speed: 0 } },
  ],
};

function pickEquipment(rarity: Equipment["rarity"], floor: number): Equipment {
  const pool = EQUIPMENT_POOL[rarity];
  const template = pool[Math.floor(Math.random() * pool.length)];
  return {
    id: randomUUID().slice(0, 8),
    ...template,
    rarity,
    stats: { ...template.stats },
    floorObtained: floor,
  };
}

export function calculateFloorReward(floor: number): FloorReward {
  const isBoss = floor % GAME.BOSS_INTERVAL === 0;
  const isElite = !isBoss && floor % GAME.ELITE_INTERVAL === 0;

  let coins = floor * GAME.COINS_PER_FLOOR;
  let gems = 0;
  const items: Equipment[] = [];

  if (isBoss) {
    coins *= 5;
    gems = GAME.BOSS_GEM_REWARD;
    const rarityRoll = Math.random();
    const rarity: Equipment["rarity"] =
      rarityRoll < 0.1 ? "legendary" :
      rarityRoll < 0.3 ? "epic" :
      rarityRoll < 0.6 ? "rare" : "uncommon";
    items.push(pickEquipment(rarity, floor));
  } else if (isElite) {
    coins *= 3;
    const rarityRoll = Math.random();
    const rarity: Equipment["rarity"] =
      rarityRoll < 0.05 ? "epic" :
      rarityRoll < 0.2 ? "rare" :
      rarityRoll < 0.5 ? "uncommon" : "common";
    items.push(pickEquipment(rarity, floor));
  }

  return { coins, items, gems };
}

export function generateToken(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export type BattleState = "idle" | "battle" | "floor_complete" | "buff_select" | "defeated";

export interface BattleEntity {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  isElite: boolean;
  isBoss: boolean;
}

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  damageMultiplier: number;
  icon: string;
}

export interface EnemyTemplate {
  name: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  isElite: boolean;
  isBoss: boolean;
}

export interface FloorReward {
  coins: number;
  items: import("./database").Equipment[];
  gems: number;
}

export interface BuffOption {
  id: string;
  name: string;
  description: string;
  type: "attack" | "defense" | "hp" | "speed";
  value: number;
}

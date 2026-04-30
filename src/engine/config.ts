import { PlayerStats } from "./types";

export const ARENA = { width: 2400, height: 2400 };

export const CAMERA = { smoothing: 8 };

export const PLAYER_BASE: PlayerStats = {
  radius: 16 as any,
  atk: 50,
  atkSpeed: 1.5,
  moveSpeed: 200,
  maxHp: 1000,
  critRate: 0.05,
  critMult: 2.0,
  armor: 0,
  hpRegen: 0,
  pierce: 1,
  multishot: 1,
  lifeSteal: 0,
} as any;

export const PLAYER_RADIUS = 16;

export const ENEMY_SCALING = {
  hpScalePerFloor: 1.12,
  atkScalePerFloor: 1.08,
  countScalePerFloor: 0.5,
  baseCount: 5,
  spawnInterval: 2.0,
  baseHp: 200,
  baseAtk: 20,
  baseSpeed: 80,
};

export const ENEMY_TYPES = {
  normal: { radius: 14, hpMult: 1.0, atkMult: 1.0, speedMult: 1.0, contactDmgMult: 1.0 },
  fast:   { radius: 10, hpMult: 0.5, atkMult: 0.8, speedMult: 2.0, contactDmgMult: 0.6 },
  tank:   { radius: 22, hpMult: 3.0, atkMult: 1.5, speedMult: 0.5, contactDmgMult: 1.5 },
  ranged: { radius: 12, hpMult: 0.8, atkMult: 1.2, speedMult: 0.7, contactDmgMult: 0.5 },
  elite:  { radius: 28, hpMult: 8.0, atkMult: 3.0, speedMult: 0.8, contactDmgMult: 2.0 },
  boss:   { radius: 40, hpMult: 25.0, atkMult: 5.0, speedMult: 0.6, contactDmgMult: 3.0 },
};

export const WAVE = {
  duration: 30,
};

export const PROJECTILE = {
  playerSpeed: 500,
  playerRadius: 5,
  playerLifetime: 2.0,
  enemySpeed: 300,
  enemyRadius: 4,
  enemyLifetime: 1.5,
};

export const PICKUP = {
  coinRadius: 8,
  healthRadius: 10,
  magnetRange: 100,
  lifetime: 15,
  healthRestorePercent: 0.05,
};

export const COLORS = {
  background: "#0a0a1a",
  grid: "rgba(139, 92, 246, 0.06)",
  player: "#8b5cf6",
  playerLight: "#c4b5fd",
  enemyNormal: "#6366f1",
  enemyFast: "#22d3ee",
  enemyTank: "#f59e0b",
  enemyRanged: "#ec4899",
  enemyElite: "#f97316",
  enemyBoss: "#ef4444",
  projectilePlayer: "#a78bfa",
  projectileEnemy: "#f87171",
  pickupCoin: "#fbbf24",
  pickupHealth: "#22c55e",
  hpBarPlayer: "#22c55e",
  hpBarEnemy: "#ef4444",
  damageText: "#ffffff",
  critText: "#fbbf24",
  healText: "#22c55e",
};

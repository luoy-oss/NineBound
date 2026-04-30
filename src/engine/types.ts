export interface Vec2 {
  x: number;
  y: number;
}

export interface Entity {
  id: number;
  type: "player" | "enemy" | "projectile" | "pickup" | "particle";
  pos: Vec2;
  vel: Vec2;
  radius: number;
  hp: number;
  maxHp: number;
  alive: boolean;
}

export interface PlayerEntity extends Entity {
  type: "player";
  atk: number;
  atkSpeed: number;
  moveSpeed: number;
  critRate: number;
  critMult: number;
  armor: number;
  hpRegen: number;
}

export type EnemyType = "normal" | "fast" | "tank" | "ranged" | "elite" | "boss";

export interface EnemyEntity extends Entity {
  type: "enemy";
  enemyType: EnemyType;
  atk: number;
  attackCooldown: number;
  attackTimer: number;
  contactDamage: number;
  moveSpeed: number;
  coinValue: number;
  isCrit?: boolean;
}

export interface ProjectileEntity extends Entity {
  type: "projectile";
  ownerId: "player" | "enemy";
  damage: number;
  pierce: number;
  lifetime: number;
  isCrit?: boolean;
}

export interface PickupEntity extends Entity {
  type: "pickup";
  pickupType: "coin" | "health";
  value: number;
  magnetRange: number;
  lifetime: number;
}

export interface ParticleEntity extends Entity {
  type: "particle";
  lifetime: number;
  maxLifetime: number;
  text?: string;
  color: string;
  alpha: number;
  fontSize?: number;
}

export type AnyEntity =
  | PlayerEntity
  | EnemyEntity
  | ProjectileEntity
  | PickupEntity
  | ParticleEntity;

export type GamePhase =
  | "playing"
  | "wave_complete"
  | "shop"
  | "game_over"
  | "upgrade"
  | "idle";

export interface GameState {
  phase: GamePhase;
  floor: number;
  waveTimer: number;
  coins: number;
  kills: number;
  totalKills: number;
  bossSpawned: boolean;
  bossDefeated: boolean;
}

export interface PlayerStats {
  atk: number;
  maxHp: number;
  atkSpeed: number;
  moveSpeed: number;
  critRate: number;
  critMult: number;
  armor: number;
  hpRegen: number;
  pierce: number;
  multishot: number;
  lifeSteal: number;
}

export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  apply: (stats: PlayerStats) => PlayerStats;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  apply: (stats: PlayerStats) => PlayerStats;
}

export interface EngineCallbacks {
  onStateChange: (state: GameState) => void;
  onWaveComplete: (floor: number, coinsEarned: number) => void;
  onPlayerDeath: () => void;
  onShowUpgrades: (options: UpgradeOption[]) => void;
  onShowShop: (items: ShopItem[], coins: number) => void;
}

// Utility
export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function vec2Add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function vec2Sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function vec2Scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function vec2Len(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function vec2Normalize(v: Vec2): Vec2 {
  const len = vec2Len(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function vec2Dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function circlesOverlap(
  aPos: Vec2,
  aRadius: number,
  bPos: Vec2,
  bRadius: number
): boolean {
  const dx = aPos.x - bPos.x;
  const dy = aPos.y - bPos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < aRadius + bRadius;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

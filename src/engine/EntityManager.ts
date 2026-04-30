import {
  AnyEntity, PlayerEntity, EnemyEntity, ProjectileEntity,
  PickupEntity, ParticleEntity, EnemyType, Vec2, PlayerStats,
} from "./types";
import { ENEMY_SCALING, ENEMY_TYPES, PLAYER_RADIUS } from "./config";

export class EntityManager {
  entities = new Map<number, AnyEntity>();
  player!: PlayerEntity;
  private nextId = 0;

  createPlayer(stats: PlayerStats): PlayerEntity {
    const p: PlayerEntity = {
      id: this.nextId++,
      type: "player",
      pos: { x: 1200, y: 1200 },
      vel: { x: 0, y: 0 },
      radius: PLAYER_RADIUS,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      alive: true,
      atk: stats.atk,
      atkSpeed: stats.atkSpeed,
      moveSpeed: stats.moveSpeed,
      critRate: stats.critRate,
      critMult: stats.critMult,
      armor: stats.armor,
      hpRegen: stats.hpRegen,
    };
    this.player = p;
    this.entities.set(p.id, p);
    return p;
  }

  createEnemy(type: EnemyType, pos: Vec2, floor: number): EnemyEntity {
    const cfg = ENEMY_TYPES[type];
    const baseHp = ENEMY_SCALING.baseHp * Math.pow(ENEMY_SCALING.hpScalePerFloor, floor - 1);
    const baseAtk = ENEMY_SCALING.baseAtk * Math.pow(ENEMY_SCALING.atkScalePerFloor, floor - 1);

    const hp = Math.floor(baseHp * cfg.hpMult);
    const atk = Math.floor(baseAtk * cfg.atkMult);
    const speed = ENEMY_SCALING.baseSpeed * cfg.speedMult;

    const e: EnemyEntity = {
      id: this.nextId++,
      type: "enemy",
      enemyType: type,
      pos: { ...pos },
      vel: { x: 0, y: 0 },
      radius: cfg.radius,
      hp, maxHp: hp,
      alive: true,
      atk,
      contactDamage: Math.floor(atk * cfg.contactDmgMult),
      attackCooldown: type === "boss" ? 2.0 : 1.0,
      attackTimer: 1.0,
      moveSpeed: speed,
      coinValue: Math.floor(5 * cfg.hpMult),
    };
    this.entities.set(e.id, e);
    return e;
  }

  createProjectile(
    ownerId: "player" | "enemy",
    pos: Vec2,
    vel: Vec2,
    damage: number,
    pierce: number,
    lifetime: number,
    isCrit: boolean = false
  ): ProjectileEntity {
    const p: ProjectileEntity = {
      id: this.nextId++,
      type: "projectile",
      ownerId,
      pos: { ...pos },
      vel: { ...vel },
      radius: 5,
      hp: 1, maxHp: 1,
      alive: true,
      damage, pierce, lifetime, isCrit,
    };
    this.entities.set(p.id, p);
    return p;
  }

  createPickup(pos: Vec2, pickupType: "coin" | "health", value: number): PickupEntity {
    const p: PickupEntity = {
      id: this.nextId++,
      type: "pickup",
      pickupType,
      pos: { x: pos.x + (Math.random() - 0.5) * 20, y: pos.y + (Math.random() - 0.5) * 20 },
      vel: { x: 0, y: 0 },
      radius: pickupType === "coin" ? 8 : 10,
      hp: 1, maxHp: 1,
      alive: true,
      value,
      magnetRange: 100,
      lifetime: 15,
    };
    this.entities.set(p.id, p);
    return p;
  }

  createParticle(pos: Vec2, text: string, color: string, fontSize: number = 14): ParticleEntity {
    const p: ParticleEntity = {
      id: this.nextId++,
      type: "particle",
      pos: { ...pos },
      vel: { x: (Math.random() - 0.5) * 30, y: -60 },
      radius: 0,
      hp: 1, maxHp: 1,
      alive: true,
      lifetime: 0.8,
      maxLifetime: 0.8,
      text, color, alpha: 1, fontSize,
    };
    this.entities.set(p.id, p);
    return p;
  }

  clearEnemies() {
    for (const [id, e] of this.entities) {
      if (e.type === "enemy" || e.type === "projectile" || e.type === "pickup" || e.type === "particle") {
        this.entities.delete(id);
      }
    }
  }

  removeDead() {
    for (const [id, e] of this.entities) {
      if (!e.alive && e.type !== "player") {
        this.entities.delete(id);
      }
    }
  }

  getByType<T extends AnyEntity>(type: T["type"]): T[] {
    const result: T[] = [];
    for (const e of this.entities.values()) {
      if (e.type === type && e.alive) result.push(e as T);
    }
    return result;
  }

  getEnemies(): EnemyEntity[] {
    return this.getByType<EnemyEntity>("enemy");
  }

  getProjectiles(): ProjectileEntity[] {
    return this.getByType<ProjectileEntity>("projectile");
  }

  getPickups(): PickupEntity[] {
    return this.getByType<PickupEntity>("pickup");
  }

  getParticles(): ParticleEntity[] {
    return this.getByType<ParticleEntity>("particle");
  }
}

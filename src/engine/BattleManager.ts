import { GAME } from "@/lib/constants";
import type { BattleEntity, BattleState, EnemyTemplate, FloorReward } from "@/types/game";

export interface SkillState {
  id: string;
  name: string;
  cooldown: number;
  maxCooldown: number;
  damageMultiplier: number;
  ready: boolean;
}

export class BattleManager {
  state: BattleState = "idle";
  currentFloor: number = 1;
  player: BattleEntity;
  enemy: BattleEntity | null = null;
  skills: SkillState[] = [];
  autoAttackTimer: number = 0;
  enemyAttackTimer: number = 0;
  playerBuffs: { attack: number; defense: number; hp: number; speed: number } = {
    attack: 0,
    defense: 0,
    hp: 0,
    speed: 0,
  };
  private onFloorComplete: (floor: number, reward: FloorReward) => void;
  private onStateChange: (state: BattleState) => void;
  private onDamage: (target: "player" | "enemy", amount: number, x: number, y: number) => void;
  private onComplete: () => void;

  constructor(callbacks: {
    onFloorComplete: (floor: number, reward: FloorReward) => void;
    onStateChange: (state: BattleState) => void;
    onDamage: (target: "player" | "enemy", amount: number, x: number, y: number) => void;
  }) {
    this.onFloorComplete = callbacks.onFloorComplete;
    this.onStateChange = callbacks.onStateChange;
    this.onDamage = callbacks.onDamage;
    this.onComplete = () => {};

    this.player = {
      name: "幸存者",
      hp: GAME.BASE_PLAYER_HP,
      maxHp: GAME.BASE_PLAYER_HP,
      attack: GAME.BASE_PLAYER_ATTACK,
      defense: GAME.BASE_PLAYER_DEFENSE,
      speed: 1,
      isElite: false,
      isBoss: false,
    };

    this.skills = [
      { id: "slash", name: "星斩", cooldown: 0, maxCooldown: GAME.SKILL_COOLDOWNS[0], damageMultiplier: GAME.SKILL_DAMAGE_MULTIPLIERS[0], ready: true },
      { id: "thrust", name: "裂空刺", cooldown: 0, maxCooldown: GAME.SKILL_COOLDOWNS[1], damageMultiplier: GAME.SKILL_DAMAGE_MULTIPLIERS[1], ready: true },
      { id: "burst", name: "玖之怒", cooldown: 0, maxCooldown: GAME.SKILL_COOLDOWNS[2], damageMultiplier: GAME.SKILL_DAMAGE_MULTIPLIERS[2], ready: true },
    ];
  }

  startFloor(floor: number, enemyTemplate: EnemyTemplate): void {
    this.currentFloor = floor;
    this.enemy = {
      name: enemyTemplate.name,
      hp: enemyTemplate.baseHp,
      maxHp: enemyTemplate.baseHp,
      attack: enemyTemplate.baseAttack,
      defense: enemyTemplate.baseDefense,
      speed: 1,
      isElite: enemyTemplate.isElite,
      isBoss: enemyTemplate.isBoss,
    };
    this.autoAttackTimer = 0;
    this.enemyAttackTimer = 0;
    this.player.hp = this.player.maxHp;
    this.state = "battle";
    this.onStateChange("battle");
  }

  update(dt: number): void {
    if (this.state !== "battle" || !this.enemy) return;

    // 玩家自动攻击
    this.autoAttackTimer += dt;
    if (this.autoAttackTimer >= GAME.AUTO_ATTACK_INTERVAL) {
      this.autoAttackTimer = 0;
      this.performAutoAttack();
    }

    // 敌人攻击
    this.enemyAttackTimer += dt;
    if (this.enemyAttackTimer >= GAME.ENEMY_ATTACK_INTERVAL) {
      this.enemyAttackTimer = 0;
      this.performEnemyAttack();
    }

    // 技能冷却
    for (const skill of this.skills) {
      if (skill.cooldown > 0) {
        skill.cooldown = Math.max(0, skill.cooldown - dt);
        if (skill.cooldown <= 0) {
          skill.ready = true;
        }
      }
    }

    // 检查胜负
    if (this.enemy.hp <= 0) {
      this.enemy.hp = 0;
      this.state = "floor_complete";
      this.onStateChange("floor_complete");
      this.calculateAndReportReward();
    }

    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.state = "defeated";
      this.onStateChange("defeated");
    }
  }

  private performAutoAttack(): void {
    if (!this.enemy) return;
    const damage = Math.max(1, this.player.attack + this.playerBuffs.attack - this.enemy.defense);
    this.enemy.hp -= damage;
    this.onDamage("enemy", damage, 400, 200);
  }

  private performEnemyAttack(): void {
    if (!this.enemy) return;
    const damage = Math.max(1, this.enemy.attack - (this.player.defense + this.playerBuffs.defense));
    this.player.hp -= damage;
    this.onDamage("player", damage, 200, 200);
  }

  activateSkill(slot: number): boolean {
    if (this.state !== "battle" || !this.enemy) return false;
    const skill = this.skills[slot];
    if (!skill || skill.cooldown > 0) return false;

    const damage = Math.max(
      1,
      Math.floor((this.player.attack + this.playerBuffs.attack) * skill.damageMultiplier) - this.enemy.defense
    );
    this.enemy.hp -= damage;
    skill.cooldown = skill.maxCooldown;
    skill.ready = false;
    this.onDamage("enemy", damage, 400, 180);
    return true;
  }

  private calculateAndReportReward(): void {
    const floor = this.currentFloor;
    const isBoss = floor % GAME.BOSS_INTERVAL === 0;
    const isElite = !isBoss && floor % GAME.ELITE_INTERVAL === 0;

    let coins = floor * GAME.COINS_PER_FLOOR;
    let gems = 0;

    if (isBoss) {
      coins *= 5;
      gems = GAME.BOSS_GEM_REWARD;
    } else if (isElite) {
      coins *= 3;
    }

    this.onFloorComplete(floor, { coins, items: [], gems });
  }

  retryFloor(enemyTemplate: EnemyTemplate): void {
    this.player.hp = this.player.maxHp;
    this.startFloor(this.currentFloor, enemyTemplate);
  }

  applyBuff(type: "attack" | "defense" | "hp" | "speed", value: number): void {
    this.playerBuffs[type] += value;
    if (type === "hp") {
      this.player.maxHp += value;
      this.player.hp += value;
    }
  }
}

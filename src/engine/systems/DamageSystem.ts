import { EntityManager } from "../EntityManager";
import { PlayerStats, GameState } from "../types";
import { PICKUP, COLORS } from "../config";
import { CollisionSystem } from "../CollisionSystem";
import { Camera } from "../Camera";

export class DamageSystem {
  private contactTimers = new Map<number, number>();

  reset() {
    this.contactTimers.clear();
  }

  update(
    dt: number,
    em: EntityManager,
    stats: PlayerStats,
    state: GameState,
    collision: CollisionSystem,
    camera: Camera
  ): { bossKilled: boolean; playerDied: boolean } {
    let bossKilled = false;
    let playerDied = false;

    // Projectile vs Enemy
    const hits = collision.checkProjectileEnemyCollisions(em);
    for (const [enemyId, hit] of hits) {
      const enemy = em.getEnemies().find(e => e.id === enemyId);
      if (!enemy) continue;

      enemy.hp -= hit.damage;
      em.createParticle(
        enemy.pos,
        `-${Math.floor(hit.damage)}`,
        hit.isCrit ? COLORS.critText : COLORS.damageText,
        hit.isCrit ? 18 : 14
      );

      // Life steal
      if (stats.lifeSteal > 0) {
        const heal = Math.floor(hit.damage * stats.lifeSteal);
        if (heal > 0) {
          em.player.hp = Math.min(em.player.maxHp, em.player.hp + heal);
        }
      }

      if (enemy.hp <= 0) {
        enemy.alive = false;
        state.kills++;
        state.totalKills++;

        // Drop coins
        em.createPickup(enemy.pos, "coin", enemy.coinValue);
        // 10% health drop
        if (Math.random() < 0.1) {
          em.createPickup(enemy.pos, "health", Math.floor(em.player.maxHp * PICKUP.healthRestorePercent));
        }

        if (enemy.enemyType === "boss") {
          bossKilled = true;
          camera.addShake(0.4);
        } else if (enemy.enemyType === "elite") {
          camera.addShake(0.15);
        }
      }
    }

    // Enemy contact damage
    const player = em.player;
    for (const enemy of em.getEnemies()) {
      if (!enemy.alive || !player.alive) continue;

      const dx = player.pos.x - enemy.pos.x;
      const dy = player.pos.y - enemy.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < player.radius + enemy.radius) {
        let timer = this.contactTimers.get(enemy.id) || 0;
        timer -= dt;
        if (timer <= 0) {
          timer = enemy.attackCooldown;
          const dmg = Math.max(1, enemy.contactDamage - stats.armor);
          player.hp -= dmg;
          em.createParticle(player.pos, `-${dmg}`, "#ef4444", 16);
          camera.addShake(0.1);

          if (player.hp <= 0) {
            player.hp = 0;
            player.alive = false;
            playerDied = true;
          }
        }
        this.contactTimers.set(enemy.id, timer);
      }
    }

    // Pickup collection
    const collectedIds = collision.checkPickupPlayerCollisions(em);
    for (const id of collectedIds) {
      const pickup = em.entities.get(id);
      if (!pickup || pickup.type !== "pickup") continue;
      pickup.alive = false;

      if (pickup.pickupType === "coin") {
        state.coins += pickup.value;
      } else if (pickup.pickupType === "health") {
        player.hp = Math.min(player.maxHp, player.hp + pickup.value);
        em.createParticle(player.pos, `+${pickup.value}`, COLORS.healText, 14);
      }
    }

    // HP regen
    if (stats.hpRegen > 0 && player.alive) {
      player.hp = Math.min(player.maxHp, player.hp + stats.hpRegen * dt);
    }

    return { bossKilled, playerDied };
  }
}

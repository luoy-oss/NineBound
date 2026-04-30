import { EntityManager } from "../EntityManager";
import { PlayerStats, vec2Dist, vec2Normalize, vec2Sub } from "../types";
import { PROJECTILE } from "../config";

export class ProjectileSystem {
  private attackTimer = 0;

  reset() {
    this.attackTimer = 0;
  }

  update(dt: number, em: EntityManager, stats: PlayerStats) {
    const player = em.player;
    if (!player.alive) return;

    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.attackTimer = 1 / stats.atkSpeed;

      const shots = stats.multishot || 1;
      for (let i = 0; i < shots; i++) {
        this.fire(em, stats, i, shots);
      }
    }
  }

  private fire(em: EntityManager, stats: PlayerStats, shotIndex: number, totalShots: number) {
    const player = em.player;
    const enemies = em.getEnemies();
    if (enemies.length === 0) return;

    // Find nearest enemy
    let nearest = enemies[0];
    let nearestDist = Infinity;
    for (const e of enemies) {
      const d = vec2Dist(player.pos, e.pos);
      if (d < nearestDist) { nearestDist = d; nearest = e; }
    }

    const baseDir = vec2Normalize(vec2Sub(nearest.pos, player.pos));

    // Multishot spread
    let dir = baseDir;
    if (totalShots > 1) {
      const spreadAngle = 0.3; // radians
      const angle = Math.atan2(baseDir.y, baseDir.x);
      const offset = (shotIndex - (totalShots - 1) / 2) * spreadAngle;
      dir = { x: Math.cos(angle + offset), y: Math.sin(angle + offset) };
    }

    const isCrit = Math.random() < stats.critRate;
    const damage = isCrit ? stats.atk * stats.critMult : stats.atk;

    em.createProjectile(
      "player",
      { ...player.pos },
      { x: dir.x * PROJECTILE.playerSpeed, y: dir.y * PROJECTILE.playerSpeed },
      damage,
      stats.pierce || 1,
      PROJECTILE.playerLifetime,
      isCrit
    );
  }
}

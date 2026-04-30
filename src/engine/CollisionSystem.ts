import { EntityManager } from "./EntityManager";
import { circlesOverlap } from "./types";

export class CollisionSystem {
  checkProjectileEnemyCollisions(em: EntityManager): Map<number, { damage: number; isCrit: boolean }> {
    const hits = new Map<number, { damage: number; isCrit: boolean }>();

    for (const proj of em.getProjectiles()) {
      if (proj.ownerId !== "player") continue;
      for (const enemy of em.getEnemies()) {
        if (!enemy.alive) continue;
        if (circlesOverlap(proj.pos, proj.radius, enemy.pos, enemy.radius)) {
          const existing = hits.get(enemy.id);
          hits.set(enemy.id, {
            damage: (existing?.damage || 0) + proj.damage,
            isCrit: proj.isCrit || false,
          });
          proj.pierce--;
          if (proj.pierce <= 0) {
            proj.alive = false;
            break;
          }
        }
      }
    }

    return hits;
  }

  checkEnemyPlayerContact(em: EntityManager): boolean {
    const player = em.player;
    if (!player.alive) return false;

    for (const enemy of em.getEnemies()) {
      if (!enemy.alive) continue;
      if (circlesOverlap(player.pos, player.radius, enemy.pos, enemy.radius)) {
        return true;
      }
    }
    return false;
  }

  checkPickupPlayerCollisions(em: EntityManager): number[] {
    const player = em.player;
    if (!player.alive) return [];

    const collected: number[] = [];
    for (const pickup of em.getPickups()) {
      if (!pickup.alive) continue;
      if (circlesOverlap(player.pos, player.radius, pickup.pos, pickup.radius)) {
        collected.push(pickup.id);
      }
    }
    return collected;
  }
}

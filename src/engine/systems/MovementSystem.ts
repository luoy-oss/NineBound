import { EntityManager } from "../EntityManager";
import { InputManager } from "../InputManager";
import { ARENA } from "../config";
import { clamp, vec2Dist, vec2Normalize, vec2Sub } from "../types";

export class MovementSystem {
  update(dt: number, em: EntityManager, input: InputManager) {
    const player = em.player;
    if (!player.alive) return;

    // Player movement
    const dir = input.getMovementDirection();
    player.vel.x = dir.x * player.moveSpeed;
    player.vel.y = dir.y * player.moveSpeed;
    player.pos.x += player.vel.x * dt;
    player.pos.y += player.vel.y * dt;
    player.pos.x = clamp(player.pos.x, player.radius, ARENA.width - player.radius);
    player.pos.y = clamp(player.pos.y, player.radius, ARENA.height - player.radius);

    // Enemy AI
    for (const enemy of em.getEnemies()) {
      if (!enemy.alive) continue;
      const toPlayer = vec2Sub(player.pos, enemy.pos);
      const dist = vec2Dist(player.pos, enemy.pos);

      if (dist > 0) {
        // Ranged enemies stop at distance
        const stopDist = enemy.enemyType === "ranged" ? 200 : 0;
        if (dist > stopDist + enemy.radius + player.radius) {
          const norm = vec2Normalize(toPlayer);
          enemy.vel.x = norm.x * enemy.moveSpeed;
          enemy.vel.y = norm.y * enemy.moveSpeed;
        } else {
          enemy.vel.x *= 0.9; // friction
          enemy.vel.y *= 0.9;
        }
      }

      enemy.pos.x += enemy.vel.x * dt;
      enemy.pos.y += enemy.vel.y * dt;
      enemy.pos.x = clamp(enemy.pos.x, enemy.radius, ARENA.width - enemy.radius);
      enemy.pos.y = clamp(enemy.pos.y, enemy.radius, ARENA.height - enemy.radius);
    }

    // Projectiles
    for (const proj of em.getProjectiles()) {
      proj.pos.x += proj.vel.x * dt;
      proj.pos.y += proj.vel.y * dt;
      proj.lifetime -= dt;
      if (
        proj.lifetime <= 0 ||
        proj.pos.x < -50 || proj.pos.x > ARENA.width + 50 ||
        proj.pos.y < -50 || proj.pos.y > ARENA.height + 50
      ) {
        proj.alive = false;
      }
    }

    // Pickups (magnet)
    for (const pickup of em.getPickups()) {
      pickup.lifetime -= dt;
      if (pickup.lifetime <= 0) { pickup.alive = false; continue; }
      const dist = vec2Dist(player.pos, pickup.pos);
      if (dist < pickup.magnetRange && dist > 0) {
        const pullSpeed = 400 * (1 - dist / pickup.magnetRange);
        const dir = vec2Normalize(vec2Sub(player.pos, pickup.pos));
        pickup.pos.x += dir.x * pullSpeed * dt;
        pickup.pos.y += dir.y * pullSpeed * dt;
      }
    }

    // Particles
    for (const p of em.getParticles()) {
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      p.lifetime -= dt;
      p.alpha = Math.max(0, p.lifetime / p.maxLifetime);
      if (p.lifetime <= 0) p.alive = false;
    }
  }
}

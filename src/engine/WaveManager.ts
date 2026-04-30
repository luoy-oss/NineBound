import { EntityManager } from "./EntityManager";
import { EnemyType, GameState, Vec2 } from "./types";
import { ENEMY_SCALING, WAVE, ARENA } from "./config";

export class WaveManager {
  private spawnTimer = 0;
  private waveEnemiesSpawned = 0;
  private waveEnemyTarget = 0;
  private bossSpawned = false;

  startWave(floor: number, state: GameState) {
    this.spawnTimer = 0;
    this.waveEnemiesSpawned = 0;
    this.waveEnemyTarget = Math.floor(
      ENEMY_SCALING.baseCount + floor * ENEMY_SCALING.countScalePerFloor
    );
    this.bossSpawned = false;
    state.waveTimer = WAVE.duration;
    state.kills = 0;
    state.bossSpawned = false;
    state.bossDefeated = false;
  }

  update(dt: number, em: EntityManager, floor: number, state: GameState) {
    if (state.phase !== "playing") return;

    // Boss已出生则停止倒计时和刷怪
    if (!this.bossSpawned) {
      state.waveTimer = Math.max(0, state.waveTimer - dt);

      // Continuous spawning
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.waveEnemiesSpawned < this.waveEnemyTarget) {
        this.spawnTimer = Math.max(0.5, ENEMY_SCALING.spawnInterval - floor * 0.02);
        this.spawnGroup(em, floor);
      }

      // Boss spawn at timer end
      if (state.waveTimer <= 0) {
        this.spawnBoss(em, floor);
        this.bossSpawned = true;
        state.bossSpawned = true;
      }
    }
  }

  private spawnGroup(em: EntityManager, floor: number) {
    const count = Math.min(3, this.waveEnemyTarget - this.waveEnemiesSpawned);
    for (let i = 0; i < count; i++) {
      const type = this.pickType(floor);
      const pos = this.edgePosition();
      em.createEnemy(type, pos, floor);
      this.waveEnemiesSpawned++;
    }
  }

  private pickType(floor: number): EnemyType {
    const r = Math.random();
    if (floor >= 20 && r < 0.05) return "elite";
    if (r < 0.45) return "normal";
    if (r < 0.65) return "fast";
    if (r < 0.82) return "tank";
    return "ranged";
  }

  private edgePosition(): Vec2 {
    const side = Math.floor(Math.random() * 4);
    const margin = 50;
    switch (side) {
      case 0: return { x: Math.random() * ARENA.width, y: -margin };
      case 1: return { x: Math.random() * ARENA.width, y: ARENA.height + margin };
      case 2: return { x: -margin, y: Math.random() * ARENA.height };
      default: return { x: ARENA.width + margin, y: Math.random() * ARENA.height };
    }
  }

  private spawnBoss(em: EntityManager, floor: number) {
    const pos = this.edgePosition();
    em.createEnemy("boss", pos, floor);
  }
}

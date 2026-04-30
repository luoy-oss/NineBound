import { BattleManager, type SkillState } from "./BattleManager";
import { Renderer } from "./Renderer";
import { AnimationManager } from "./AnimationManager";
import { generateEnemy } from "@/lib/game-engine";
import type { BattleState, FloorReward } from "@/types/game";

export interface GameCallbacks {
  onFloorComplete: (floor: number, reward: FloorReward) => void;
  onStateChange: (state: BattleState) => void;
  onStatsUpdate: (stats: {
    playerHp: number;
    playerMaxHp: number;
    enemyHp: number;
    enemyMaxHp: number;
    enemyName: string;
    isElite: boolean;
    isBoss: boolean;
    skills: SkillState[];
  }) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private battleManager: BattleManager;
  private renderer: Renderer;
  private animationManager: AnimationManager;
  private running = false;
  private lastTime = 0;
  private callbacks: GameCallbacks;
  private statsUpdateTimer = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.callbacks = callbacks;

    this.renderer = new Renderer(this.ctx, canvas.width, canvas.height);
    this.animationManager = new AnimationManager();

    this.battleManager = new BattleManager({
      onFloorComplete: (floor, reward) => callbacks.onFloorComplete(floor, reward),
      onStateChange: (state) => callbacks.onStateChange(state),
      onDamage: (target, amount, x, y) => {
        this.animationManager.addDamage(target, amount, x, y);
      },
    });
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
  }

  startFloor(floor: number): void {
    const enemy = generateEnemy(floor);
    this.battleManager.startFloor(floor, enemy);
    this.animationManager.clear();
  }

  retryFloor(): void {
    const enemy = generateEnemy(this.battleManager.currentFloor);
    this.battleManager.retryFloor(enemy);
    this.animationManager.clear();
  }

  activateSkill(slot: number): boolean {
    return this.battleManager.activateSkill(slot);
  }

  applyBuff(type: "attack" | "defense" | "hp" | "speed", value: number): void {
    this.battleManager.applyBuff(type, value);
  }

  get currentFloor(): number {
    return this.battleManager.currentFloor;
  }

  get state(): BattleState {
    return this.battleManager.state;
  }

  get needsBuffSelection(): boolean {
    return (
      this.battleManager.currentFloor % 5 === 0 &&
      this.battleManager.state === "floor_complete"
    );
  }

  private loop(timestamp: number): void {
    if (!this.running) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.battleManager.update(dt);
    this.animationManager.update(dt);

    // 渲染
    this.renderer.clear();
    this.renderer.drawBackground(this.battleManager.currentFloor);
    this.renderer.drawPlayer(this.battleManager.player);
    this.renderer.drawEnemy(this.battleManager.enemy);
    this.renderer.drawAnimations(this.animationManager.active);
    this.renderer.drawBattleState(this.battleManager.state, this.battleManager.currentFloor);

    // 定期更新UI状态 (不每帧更新避免re-render风暴)
    this.statsUpdateTimer += dt;
    if (this.statsUpdateTimer >= 0.1) {
      this.statsUpdateTimer = 0;
      const enemy = this.battleManager.enemy;
      this.callbacks.onStatsUpdate({
        playerHp: this.battleManager.player.hp,
        playerMaxHp: this.battleManager.player.maxHp,
        enemyHp: enemy?.hp ?? 0,
        enemyMaxHp: enemy?.maxHp ?? 0,
        enemyName: enemy?.name ?? "",
        isElite: enemy?.isElite ?? false,
        isBoss: enemy?.isBoss ?? false,
        skills: this.battleManager.skills,
      });
    }

    requestAnimationFrame(this.loop.bind(this));
  }
}

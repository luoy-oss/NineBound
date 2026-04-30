import { EntityManager } from "./EntityManager";
import { InputManager } from "./InputManager";
import { Camera } from "./Camera";
import { Renderer } from "./Renderer";
import { CollisionSystem } from "./CollisionSystem";
import { WaveManager } from "./WaveManager";
import { UpgradeSystem } from "./UpgradeSystem";
import { MovementSystem } from "./systems/MovementSystem";
import { ProjectileSystem } from "./systems/ProjectileSystem";
import { DamageSystem } from "./systems/DamageSystem";

import { GameState, PlayerStats, EngineCallbacks, UpgradeOption, ShopItem } from "./types";
import { ARENA, WAVE } from "./config";

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private em: EntityManager;
  private input: InputManager;
  private camera: Camera;
  private renderer: Renderer;
  private collision: CollisionSystem;
  private waveManager: WaveManager;
  private upgradeSystem: UpgradeSystem;
  private movementSystem: MovementSystem;
  private projectileSystem: ProjectileSystem;
  private damageSystem: DamageSystem;
  private callbacks: EngineCallbacks;
  private playerStats: PlayerStats;
  private state: GameState;
  private lastTime = 0;
  private rafId = 0;
  private running = false;
  private appliedUpgradeIds: string[] = [];
  private gameSpeed = 1;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.callbacks = callbacks;

    this.em = new EntityManager();
    this.input = new InputManager();
    this.camera = new Camera();
    this.renderer = new Renderer(this.ctx, this.camera, this.em);
    this.collision = new CollisionSystem();
    this.waveManager = new WaveManager();
    this.upgradeSystem = new UpgradeSystem();
    this.movementSystem = new MovementSystem();
    this.projectileSystem = new ProjectileSystem();
    this.damageSystem = new DamageSystem();

    this.playerStats = this.defaultStats();
    this.state = this.defaultState();

    this.onResize = this.onResize.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
  }

  private defaultStats(): PlayerStats {
    return {
      atk: 50, maxHp: 1000, atkSpeed: 1.5, moveSpeed: 200,
      critRate: 0.05, critMult: 2.0, armor: 0, hpRegen: 0,
      pierce: 1, multishot: 1, lifeSteal: 0,
    };
  }

  private defaultState(): GameState {
    return {
      phase: "idle", floor: 1, waveTimer: WAVE.duration,
      coins: 0, kills: 0, totalKills: 0,
      bossSpawned: false, bossDefeated: false,
    };
  }

  start(floor: number, stats: PlayerStats) {
    this.playerStats = { ...stats };
    this.state.floor = floor;
    this.state.coins = 0;
    this.state.totalKills = 0;
    this.appliedUpgradeIds = [];
    this.running = true;

    this.setupCanvas();
    window.addEventListener("resize", this.onResize);
    this.input.bind();

    this.em.createPlayer(this.playerStats);
    this.startWave();

    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.gameLoop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.input.unbind();
    window.removeEventListener("resize", this.onResize);
  }

  private setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement?.getBoundingClientRect() || { width: 800, height: 600 };
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.scale(dpr, dpr);
    this.camera.setViewSize(rect.width, rect.height);
  }

  private onResize() {
    if (!this.running) return;
    this.setupCanvas();
  }

  private gameLoop(timestamp: number) {
    if (!this.running) return;

    let dt = (timestamp - this.lastTime) / 1000;
    dt = Math.min(dt, 0.05) * this.gameSpeed; // cap then apply speed
    this.lastTime = timestamp;

    if (this.state.phase === "playing") {
      this.update(dt);
    }

    this.renderer.render(this.state, dt);
    this.rafId = requestAnimationFrame(this.gameLoop);
  }

  private update(dt: number) {
    this.movementSystem.update(dt, this.em, this.input);
    this.projectileSystem.update(dt, this.em, this.playerStats);
    const result = this.damageSystem.update(dt, this.em, this.playerStats, this.state, this.collision, this.camera);
    this.em.removeDead();
    this.waveManager.update(dt, this.em, this.state.floor, this.state);

    // Camera follow
    if (this.em.player.alive) {
      this.camera.target = { ...this.em.player.pos };
    }
    this.camera.update(dt);

    // State callbacks
    this.callbacks.onStateChange({ ...this.state });

    // Boss killed
    if (result.bossKilled) {
      this.handleWaveComplete();
      return;
    }

    // Player died
    if (result.playerDied) {
      this.handlePlayerDeath();
    }
  }

  private startWave() {
    this.state.phase = "playing";
    this.state.kills = 0;
    this.state.bossSpawned = false;
    this.state.bossDefeated = false;
    this.em.clearEnemies();
    this.damageSystem.reset();
    this.projectileSystem.reset();
    this.waveManager.startWave(this.state.floor, this.state);

    // Reset player position and HP
    const player = this.em.player;
    player.pos = { x: ARENA.width / 2, y: ARENA.height / 2 };
    player.hp = this.playerStats.maxHp;
    player.maxHp = this.playerStats.maxHp;
    player.alive = true;
    player.atk = this.playerStats.atk;
    player.atkSpeed = this.playerStats.atkSpeed;
    player.moveSpeed = this.playerStats.moveSpeed;
    player.critRate = this.playerStats.critRate;
    player.critMult = this.playerStats.critMult;
    player.armor = this.playerStats.armor;
    player.hpRegen = this.playerStats.hpRegen;
  }

  private handleWaveComplete() {
    this.state.phase = "wave_complete";
    this.state.bossDefeated = true;
    this.callbacks.onWaveComplete(this.state.floor, this.state.coins);
    this.callbacks.onStateChange({ ...this.state });

    // Show upgrades
    const options = this.upgradeSystem.getRandomUpgrades(3, this.appliedUpgradeIds);
    if (options.length > 0) {
      this.state.phase = "upgrade";
      this.callbacks.onShowUpgrades(options);
    } else {
      this.checkShopOrNextWave();
    }
  }

  private handlePlayerDeath() {
    this.state.phase = "game_over";
    this.callbacks.onPlayerDeath();
    this.callbacks.onStateChange({ ...this.state });
  }

  applyUpgrade(upgrade: UpgradeOption) {
    this.playerStats = this.upgradeSystem.applyUpgrade(upgrade, this.playerStats);
    this.appliedUpgradeIds.push(upgrade.id);
    this.checkShopOrNextWave();
  }

  private checkShopOrNextWave() {
    // Every 5 floors, show shop
    if (this.state.floor % 5 === 0 && this.state.coins > 0) {
      const items = this.upgradeSystem.getShopItems(this.state.floor);
      this.state.phase = "shop";
      this.callbacks.onShowShop(items, this.state.coins);
    } else {
      this.advanceFloor();
    }
  }

  purchaseShopItem(item: ShopItem): boolean {
    if (this.state.coins < item.cost) return false;
    this.state.coins -= item.cost;
    this.playerStats = item.apply(this.playerStats);
    this.callbacks.onStateChange({ ...this.state });
    return true;
  }

  closeShopAndAdvance() {
    this.advanceFloor();
  }

  private advanceFloor() {
    this.state.floor++;
    this.startWave();
  }

  // Called from React when retrying after death
  retry() {
    this.state.coins = 0;
    this.state.totalKills = 0;
    this.appliedUpgradeIds = [];
    this.startWave();
  }

  getState(): GameState {
    return { ...this.state };
  }

  getPlayerStats(): PlayerStats {
    return { ...this.playerStats };
  }

  getInput(): InputManager {
    return this.input;
  }

  setSpeed(speed: number) {
    this.gameSpeed = speed;
  }

  getSpeed(): number {
    return this.gameSpeed;
  }
}

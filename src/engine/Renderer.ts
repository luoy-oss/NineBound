import { EntityManager } from "./EntityManager";
import { Camera } from "./Camera";
import { ARENA, COLORS, ENEMY_TYPES } from "./config";
import { GameState, EnemyType } from "./types";

const ENEMY_COLOR_MAP: Record<EnemyType, string> = {
  normal: COLORS.enemyNormal,
  fast: COLORS.enemyFast,
  tank: COLORS.enemyTank,
  ranged: COLORS.enemyRanged,
  elite: COLORS.enemyElite,
  boss: COLORS.enemyBoss,
};

// Pre-generate stars
const STARS: { x: number; y: number; size: number; speed: number }[] = [];
for (let i = 0; i < 120; i++) {
  STARS.push({
    x: Math.random() * ARENA.width,
    y: Math.random() * ARENA.height,
    size: 0.5 + Math.random() * 2,
    speed: 0.3 + Math.random() * 0.7,
  });
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private em: EntityManager;
  private time = 0;

  constructor(ctx: CanvasRenderingContext2D, camera: Camera, em: EntityManager) {
    this.ctx = ctx;
    this.camera = camera;
    this.em = em;
  }

  render(state: GameState, dt: number) {
    this.time += dt;
    const { ctx, camera } = this;
    const w = camera.viewWidth;
    const h = camera.viewHeight;

    // Clear
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, w, h);

    // Stars (parallax)
    this.drawStars(w, h);

    // Grid
    this.drawGrid(w, h);

    // Arena boundary
    this.drawArenaBounds(w, h);

    // Pickups
    for (const p of this.em.getPickups()) {
      if (!camera.isVisible(p.pos, p.radius)) continue;
      this.drawPickup(p.pos.x, p.pos.y, p.pickupType, p.radius);
    }

    // Enemies
    for (const e of this.em.getEnemies()) {
      if (!camera.isVisible(e.pos, e.radius)) continue;
      this.drawEnemy(e.pos.x, e.pos.y, e.enemyType, e.hp, e.maxHp, e.radius);
    }

    // Projectiles
    for (const p of this.em.getProjectiles()) {
      if (!camera.isVisible(p.pos, p.radius + 3)) continue;
      const color = p.ownerId === "player" ? COLORS.projectilePlayer : COLORS.projectileEnemy;
      this.drawProjectile(p.pos.x, p.pos.y, p.radius, color, p.isCrit);
    }

    // Player
    const player = this.em.player;
    if (player.alive) {
      this.drawPlayer(player.pos.x, player.pos.y, player.hp, player.maxHp);
    }

    // Particles (damage numbers)
    for (const p of this.em.getParticles()) {
      if (!camera.isVisible(p.pos, 30)) continue;
      if (p.text) {
        this.drawDamageText(p.pos.x, p.pos.y, p.text, p.color, p.alpha, p.fontSize || 14);
      }
    }

    // HUD
    this.drawHUD(state, w, h);

    // Minimap
    this.drawMinimap(w, h, state);
  }

  private drawStars(w: number, h: number) {
    const { ctx, camera } = this;
    for (const star of STARS) {
      const parallax = 0.3 * star.speed;
      const sx = ((star.x - camera.pos.x * parallax) % ARENA.width + ARENA.width) % ARENA.width;
      const sy = ((star.y - camera.pos.y * parallax) % ARENA.height + ARENA.height) % ARENA.height;
      if (sx < 0 || sx > w || sy < 0 || sy > h) continue;
      const alpha = 0.3 + 0.4 * Math.sin(this.time * star.speed + star.x);
      ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawGrid(w: number, h: number) {
    const { ctx, camera } = this;
    const gridSize = 100;
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;

    const startX = Math.floor((camera.pos.x - w / 2) / gridSize) * gridSize;
    const startY = Math.floor((camera.pos.y - h / 2) / gridSize) * gridSize;

    for (let x = startX; x < camera.pos.x + w / 2; x += gridSize) {
      const s = camera.worldToScreen({ x, y: 0 });
      ctx.beginPath();
      ctx.moveTo(s.x, 0);
      ctx.lineTo(s.x, h);
      ctx.stroke();
    }
    for (let y = startY; y < camera.pos.y + h / 2; y += gridSize) {
      const s = camera.worldToScreen({ x: 0, y });
      ctx.beginPath();
      ctx.moveTo(0, s.y);
      ctx.lineTo(w, s.y);
      ctx.stroke();
    }
  }

  private drawArenaBounds(w: number, h: number) {
    const { ctx, camera } = this;
    const tl = camera.worldToScreen({ x: 0, y: 0 });
    const br = camera.worldToScreen({ x: ARENA.width, y: ARENA.height });

    ctx.strokeStyle = `rgba(139, 92, 246, ${0.2 + 0.1 * Math.sin(this.time * 2)})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
  }

  private drawPlayer(wx: number, wy: number, hp: number, maxHp: number) {
    const { ctx, camera } = this;
    const s = camera.worldToScreen({ x: wx, y: wy });
    const p = 2.5; // pixel size
    const bob = Math.sin(this.time * 3) * 1.5; // subtle bobbing

    // === Glow aura ===
    const gradient = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 28);
    gradient.addColorStop(0, "rgba(139, 92, 246, 0.15)");
    gradient.addColorStop(1, "rgba(139, 92, 246, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 28, 0, Math.PI * 2);
    ctx.fill();

    // === Jetpack (behind body) ===
    ctx.fillStyle = "#4c1d95";
    ctx.fillRect(s.x - 5 * p, s.y - 1 * p + bob, 2 * p, 4 * p);
    ctx.fillRect(s.x + 3 * p, s.y - 1 * p + bob, 2 * p, 4 * p);
    // Thruster glow
    const thrustAlpha = 0.4 + 0.3 * Math.sin(this.time * 12);
    ctx.fillStyle = `rgba(167, 139, 250, ${thrustAlpha})`;
    ctx.fillRect(s.x - 4.5 * p, s.y + 3 * p + bob, 1 * p, 2 * p);
    ctx.fillRect(s.x + 3.5 * p, s.y + 3 * p + bob, 1 * p, 2 * p);

    // === Legs ===
    ctx.fillStyle = "#6d28d9";
    ctx.fillRect(s.x - 3 * p, s.y + 4 * p + bob, 2 * p, 3 * p);
    ctx.fillRect(s.x + 1 * p, s.y + 4 * p + bob, 2 * p, 3 * p);
    // Feet
    ctx.fillStyle = "#8b5cf6";
    ctx.fillRect(s.x - 3.5 * p, s.y + 7 * p + bob, 3 * p, 1 * p);
    ctx.fillRect(s.x + 0.5 * p, s.y + 7 * p + bob, 3 * p, 1 * p);

    // === Body (torso) ===
    ctx.fillStyle = "#7c3aed";
    ctx.fillRect(s.x - 4 * p, s.y - 2 * p + bob, 8 * p, 6 * p);
    // Chest plate highlight
    ctx.fillStyle = "#8b5cf6";
    ctx.fillRect(s.x - 3 * p, s.y - 1 * p + bob, 6 * p, 4 * p);
    // Core light
    ctx.fillStyle = "#c4b5fd";
    ctx.fillRect(s.x - 0.5 * p, s.y + 0.5 * p + bob, 1 * p, 1 * p);
    ctx.fillStyle = `rgba(196, 181, 253, ${0.5 + 0.5 * Math.sin(this.time * 4)})`;
    ctx.fillRect(s.x - 1 * p, s.y + 0 * p + bob, 2 * p, 2 * p);

    // === Shoulder armor ===
    ctx.fillStyle = "#6d28d9";
    ctx.fillRect(s.x - 6 * p, s.y - 3 * p + bob, 3 * p, 3 * p);
    ctx.fillRect(s.x + 3 * p, s.y - 3 * p + bob, 3 * p, 3 * p);
    // Shoulder highlights
    ctx.fillStyle = "#8b5cf6";
    ctx.fillRect(s.x - 5.5 * p, s.y - 2.5 * p + bob, 2 * p, 1.5 * p);
    ctx.fillRect(s.x + 3.5 * p, s.y - 2.5 * p + bob, 2 * p, 1.5 * p);

    // === Arms ===
    ctx.fillStyle = "#7c3aed";
    ctx.fillRect(s.x - 6 * p, s.y - 0.5 * p + bob, 2 * p, 4 * p);
    ctx.fillRect(s.x + 4 * p, s.y - 0.5 * p + bob, 2 * p, 4 * p);
    // Weapon arm (right) - glowing barrel
    ctx.fillStyle = "#4c1d95";
    ctx.fillRect(s.x + 4.5 * p, s.y + 3.5 * p + bob, 1 * p, 2 * p);
    ctx.fillStyle = `rgba(167, 139, 250, ${0.3 + 0.2 * Math.sin(this.time * 6)})`;
    ctx.fillRect(s.x + 4.5 * p, s.y + 5.5 * p + bob, 1 * p, 1 * p);

    // === Head ===
    ctx.fillStyle = "#6d28d9";
    ctx.fillRect(s.x - 3 * p, s.y - 6 * p + bob, 6 * p, 4 * p);
    // Helmet top
    ctx.fillStyle = "#7c3aed";
    ctx.fillRect(s.x - 2.5 * p, s.y - 7 * p + bob, 5 * p, 2 * p);
    // Visor (glowing)
    const visorAlpha = 0.7 + 0.3 * Math.sin(this.time * 3);
    ctx.fillStyle = `rgba(196, 181, 253, ${visorAlpha})`;
    ctx.fillRect(s.x - 2.5 * p, s.y - 5 * p + bob, 5 * p, 2 * p);
    // Visor shine
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + 0.2 * Math.sin(this.time * 2)})`;
    ctx.fillRect(s.x - 2 * p, s.y - 4.5 * p + bob, 1.5 * p, 0.5 * p);
    // Antenna
    ctx.fillStyle = "#c4b5fd";
    ctx.fillRect(s.x - 0.5 * p, s.y - 9 * p + bob, 1 * p, 2 * p);
    // Antenna tip (pulsing)
    ctx.fillStyle = `rgba(167, 139, 250, ${0.5 + 0.5 * Math.sin(this.time * 5)})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y - 9.5 * p + bob, 2 * p, 0, Math.PI * 2);
    ctx.fill();

    // === HP bar ===
    this.drawHpBar(s.x, s.y + 10 * p, 36, hp / maxHp, COLORS.hpBarPlayer);
  }

  private drawEnemy(wx: number, wy: number, type: EnemyType, hp: number, maxHp: number, radius: number) {
    const { ctx, camera } = this;
    const s = camera.worldToScreen({ x: wx, y: wy });
    const color = ENEMY_COLOR_MAP[type];
    const scale = radius / 14;
    const p = 2.5 * scale;
    const bob = Math.sin(this.time * 2.5 + wx * 0.01) * 1.2;

    // Glow aura for special types
    if (type === "boss" || type === "elite") {
      const auraColor = type === "boss" ? "rgba(239, 68, 68," : "rgba(249, 115, 22,";
      ctx.globalAlpha = 0.15 + 0.1 * Math.sin(this.time * 3);
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, radius + 12);
      grad.addColorStop(0, auraColor + "0.3)");
      grad.addColorStop(1, auraColor + "0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius + 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = color;

    if (type === "boss") {
      // === BOSS: menacing demon robot ===
      // Body
      ctx.fillStyle = "#991b1b";
      ctx.fillRect(s.x - 5 * p, s.y - 2 * p + bob, 10 * p, 8 * p);
      ctx.fillStyle = color;
      ctx.fillRect(s.x - 4 * p, s.y - 1 * p + bob, 8 * p, 6 * p);
      // Chest symbol
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(s.x - 1 * p, s.y + 1 * p + bob, 2 * p, 2 * p);
      // Horns
      ctx.fillStyle = "#7f1d1d";
      ctx.fillRect(s.x - 5 * p, s.y - 6 * p + bob, 2 * p, 4 * p);
      ctx.fillRect(s.x + 3 * p, s.y - 6 * p + bob, 2 * p, 4 * p);
      ctx.fillStyle = color;
      ctx.fillRect(s.x - 4.5 * p, s.y - 5 * p + bob, 1 * p, 3 * p);
      ctx.fillRect(s.x + 3.5 * p, s.y - 5 * p + bob, 1 * p, 3 * p);
      // Head
      ctx.fillRect(s.x - 4 * p, s.y - 5 * p + bob, 8 * p, 4 * p);
      // Eyes (glowing)
      const eyeGlow = 0.7 + 0.3 * Math.sin(this.time * 4);
      ctx.fillStyle = `rgba(251, 191, 36, ${eyeGlow})`;
      ctx.fillRect(s.x - 3 * p, s.y - 4 * p + bob, 2.5 * p, 2 * p);
      ctx.fillRect(s.x + 0.5 * p, s.y - 4 * p + bob, 2.5 * p, 2 * p);
      // Eye pupils
      ctx.fillStyle = "#000";
      ctx.fillRect(s.x - 2 * p, s.y - 3.5 * p + bob, 1 * p, 1 * p);
      ctx.fillRect(s.x + 1 * p, s.y - 3.5 * p + bob, 1 * p, 1 * p);
      // Claws
      ctx.fillStyle = "#7f1d1d";
      ctx.fillRect(s.x - 7 * p, s.y - 1 * p + bob, 2 * p, 5 * p);
      ctx.fillRect(s.x + 5 * p, s.y - 1 * p + bob, 2 * p, 5 * p);
      ctx.fillStyle = color;
      ctx.fillRect(s.x - 7 * p, s.y + 0 * p + bob, 1.5 * p, 3 * p);
      ctx.fillRect(s.x + 5.5 * p, s.y + 0 * p + bob, 1.5 * p, 3 * p);
      // HP bar
      this.drawHpBar(s.x, s.y + 8 * p, 50, hp / maxHp, COLORS.hpBarEnemy);
      ctx.fillStyle = COLORS.enemyBoss;
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("BOSS", s.x, s.y - 8 * p);
    } else if (type === "elite") {
      // === ELITE: armored warrior ===
      ctx.fillStyle = color;
      ctx.fillRect(s.x - 4 * p, s.y - 2 * p + bob, 8 * p, 6 * p);
      ctx.fillRect(s.x - 3 * p, s.y - 4 * p + bob, 6 * p, 3 * p);
      // Armor plates
      ctx.fillStyle = `rgba(255, 255, 255, 0.15)`;
      ctx.fillRect(s.x - 3 * p, s.y - 1 * p + bob, 6 * p, 2 * p);
      // Eyes
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(s.x - 2 * p, s.y - 3 * p + bob, 1.5 * p, 1.5 * p);
      ctx.fillRect(s.x + 0.5 * p, s.y - 3 * p + bob, 1.5 * p, 1.5 * p);
      // Crown mark
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(s.x - 1.5 * p, s.y - 5.5 * p + bob, 1 * p, 1.5 * p);
      ctx.fillRect(s.x + 0.5 * p, s.y - 5.5 * p + bob, 1 * p, 1.5 * p);
      this.drawHpBar(s.x, s.y + 6 * p, 36, hp / maxHp, COLORS.hpBarEnemy);
    } else if (type === "fast") {
      // === FAST: sleek dart shape ===
      ctx.fillStyle = color;
      ctx.fillRect(s.x - 2 * p, s.y - 3 * p + bob, 4 * p, 6 * p);
      ctx.fillRect(s.x - 3 * p, s.y - 1 * p + bob, 6 * p, 3 * p);
      // Wings
      ctx.globalAlpha = 0.5;
      ctx.fillRect(s.x - 5 * p, s.y + 0 * p + bob, 2 * p, 2 * p);
      ctx.fillRect(s.x + 3 * p, s.y + 0 * p + bob, 2 * p, 2 * p);
      ctx.globalAlpha = 1;
      // Eyes
      ctx.fillStyle = "#fff";
      ctx.fillRect(s.x - 1 * p, s.y - 2 * p + bob, 1 * p, 1 * p);
      ctx.fillRect(s.x + 0.5 * p, s.y - 2 * p + bob, 1 * p, 1 * p);
      this.drawHpBar(s.x, s.y + 4 * p, 18, hp / maxHp, COLORS.hpBarEnemy);
    } else if (type === "tank") {
      // === TANK: bulky armored ===
      ctx.fillStyle = color;
      ctx.fillRect(s.x - 4 * p, s.y - 2 * p + bob, 8 * p, 6 * p);
      ctx.fillRect(s.x - 3 * p, s.y - 4 * p + bob, 6 * p, 3 * p);
      // Armor overlay
      ctx.fillStyle = `rgba(0, 0, 0, 0.2)`;
      ctx.fillRect(s.x - 4.5 * p, s.y - 1 * p + bob, 9 * p, 5 * p);
      ctx.fillStyle = color;
      ctx.fillRect(s.x - 4 * p, s.y - 0.5 * p + bob, 8 * p, 4 * p);
      // Eyes (menacing slits)
      ctx.fillStyle = "#000";
      ctx.fillRect(s.x - 2.5 * p, s.y - 3 * p + bob, 2 * p, 0.5 * p);
      ctx.fillRect(s.x + 0.5 * p, s.y - 3 * p + bob, 2 * p, 0.5 * p);
      this.drawHpBar(s.x, s.y + 6 * p, 26, hp / maxHp, COLORS.hpBarEnemy);
    } else if (type === "ranged") {
      // === RANGED: floating orb with appendages ===
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(s.x, s.y + bob, 4 * p, 0, Math.PI * 2);
      ctx.fill();
      // Inner glow
      ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
      ctx.beginPath();
      ctx.arc(s.x, s.y + bob, 2.5 * p, 0, Math.PI * 2);
      ctx.fill();
      // Eye
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(s.x, s.y - 0.5 * p + bob, 1.5 * p, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(s.x, s.y - 0.5 * p + bob, 0.8 * p, 0, Math.PI * 2);
      ctx.fill();
      // Tendrils
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const angle = (this.time * 2 + i * 2.1) % (Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y + bob);
        ctx.lineTo(s.x + Math.cos(angle) * 5 * p, s.y + Math.sin(angle) * 5 * p + bob);
        ctx.stroke();
      }
      this.drawHpBar(s.x, s.y + 6 * p, 18, hp / maxHp, COLORS.hpBarEnemy);
    } else {
      // === NORMAL: basic creature ===
      ctx.fillStyle = color;
      ctx.fillRect(s.x - 3 * p, s.y - 2 * p + bob, 6 * p, 5 * p);
      ctx.fillRect(s.x - 2 * p, s.y - 4 * p + bob, 4 * p, 3 * p);
      // Eyes
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(s.x - 1.5 * p, s.y - 3 * p + bob, 1.2 * p, 1.2 * p);
      ctx.fillRect(s.x + 0.3 * p, s.y - 3 * p + bob, 1.2 * p, 1.2 * p);
      // Pupils
      ctx.fillStyle = "#000";
      ctx.fillRect(s.x - 1 * p, s.y - 2.5 * p + bob, 0.6 * p, 0.6 * p);
      ctx.fillRect(s.x + 0.6 * p, s.y - 2.5 * p + bob, 0.6 * p, 0.6 * p);
      // Mouth
      ctx.fillStyle = `rgba(0, 0, 0, 0.3)`;
      ctx.fillRect(s.x - 1 * p, s.y + 0.5 * p + bob, 2 * p, 0.5 * p);
      this.drawHpBar(s.x, s.y + 5 * p, 20, hp / maxHp, COLORS.hpBarEnemy);
    }
  }

  private drawProjectile(wx: number, wy: number, radius: number, color: string, isCrit?: boolean) {
    const { ctx, camera } = this;
    const s = camera.worldToScreen({ x: wx, y: wy });
    const r = isCrit ? radius + 2 : radius;

    // Glow
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Core
    ctx.fillStyle = isCrit ? COLORS.critText : color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawPickup(wx: number, wy: number, type: "coin" | "health", radius: number) {
    const { ctx, camera } = this;
    const s = camera.worldToScreen({ x: wx, y: wy });
    const pulse = 1 + 0.15 * Math.sin(this.time * 4);

    if (type === "coin") {
      ctx.fillStyle = COLORS.pickupCoin;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius * pulse + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("$", s.x, s.y);
    } else {
      ctx.fillStyle = COLORS.pickupHealth;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius * pulse + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(s.x - 4, s.y - 1, 8, 2);
      ctx.fillRect(s.x - 1, s.y - 4, 2, 8);
    }
  }

  private drawDamageText(wx: number, wy: number, text: string, color: string, alpha: number, size: number) {
    const { ctx, camera } = this;
    const s = camera.worldToScreen({ x: wx, y: wy });
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillText(text, s.x + 1, s.y + 1);
    ctx.fillStyle = color;
    ctx.fillText(text, s.x, s.y);
    ctx.globalAlpha = 1;
  }

  private drawHpBar(x: number, y: number, width: number, ratio: number, color: string) {
    const { ctx } = this;
    const h = 4;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(x - width / 2, y, width, h);
    ctx.fillStyle = color;
    ctx.fillRect(x - width / 2, y, width * Math.max(0, Math.min(1, ratio)), h);
  }

  private drawHUD(state: GameState, w: number, h: number) {
    const { ctx } = this;

    // Wave timer (top center)
    if (state.phase === "playing") {
      const cx = w / 2;
      const cy = 40;
      const radius = 22;

      // Background circle
      ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Timer arc
      const ratio = Math.max(0, state.waveTimer / 30);
      const isLow = state.waveTimer < 5;
      ctx.strokeStyle = isLow ? "#ef4444" : "#8b5cf6";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2);
      ctx.stroke();

      // Time text
      ctx.fillStyle = isLow ? "#ef4444" : "#e0e0ff";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${Math.ceil(state.waveTimer)}`, cx, cy);

      // Floor number
      ctx.fillStyle = "#8b5cf6";
      ctx.font = "bold 13px monospace";
      ctx.fillText(`第 ${state.floor} 层`, cx, cy + radius + 14);

      // Boss warning
      if (state.bossSpawned && !state.bossDefeated) {
        ctx.fillStyle = `rgba(239, 68, 68, ${0.5 + 0.5 * Math.sin(this.time * 5)})`;
        ctx.font = "bold 16px monospace";
        ctx.fillText("⚠ BOSS ⚠", cx, cy - radius - 10);
      }
    }

    // Kill count (top left)
    ctx.fillStyle = "#a78bfa";
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`击杀: ${state.kills}`, 16, 16);

    // Coins (top right)
    ctx.textAlign = "right";
    ctx.fillStyle = COLORS.pickupCoin;
    ctx.fillText(`💰 ${state.coins}`, w - 16, 16);
  }

  private drawMinimap(w: number, h: number, state: GameState) {
    const { ctx, em } = this;
    const size = 100;
    const margin = 12;
    const mx = w - size - margin;
    const my = h - size - margin;
    const scale = size / ARENA.width;

    // Background
    ctx.fillStyle = "rgba(10, 10, 26, 0.7)";
    ctx.fillRect(mx, my, size, size);
    ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, size, size);

    // Enemies
    for (const e of em.getEnemies()) {
      const ex = mx + e.pos.x * scale;
      const ey = my + e.pos.y * scale;
      ctx.fillStyle = e.enemyType === "boss" ? COLORS.enemyBoss :
                      e.enemyType === "elite" ? COLORS.enemyElite : COLORS.enemyNormal;
      ctx.fillRect(ex - 1, ey - 1, e.enemyType === "boss" ? 4 : 2, e.enemyType === "boss" ? 4 : 2);
    }

    // Player
    const px = mx + em.player.pos.x * scale;
    const py = my + em.player.pos.y * scale;
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(px - 2, py - 2, 4, 4);
  }
}

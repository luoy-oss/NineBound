import type { BattleEntity, BattleState } from "@/types/game";
import type { DamageNumber } from "./AnimationManager";

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private time: number = 0;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  clear(): void {
    this.ctx.fillStyle = "#0a0a1a";
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawBackground(floor: number): void {
    const ctx = this.ctx;
    this.time += 0.02;

    // 星空背景
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, this.width, this.height);

    // 星星
    for (let i = 0; i < 50; i++) {
      const x = ((i * 137 + floor * 7) % this.width);
      const y = ((i * 251 + floor * 3) % (this.height * 0.6));
      const size = (i % 3) + 0.5;
      const brightness = 0.3 + Math.sin(this.time * 2 + i) * 0.3;
      ctx.fillStyle = `rgba(200, 200, 255, ${brightness})`;
      ctx.fillRect(x, y, size, size);
    }

    // 地面线
    const groundY = this.height * 0.75;
    const gradient = ctx.createLinearGradient(0, groundY, 0, this.height);
    gradient.addColorStop(0, "#1a1a3a");
    gradient.addColorStop(1, "#0a0a1a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, groundY, this.width, this.height - groundY);

    // 地面线条
    ctx.strokeStyle = "rgba(155, 89, 182, 0.3)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const y = groundY + i * 12;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // 层数标识
    ctx.fillStyle = "rgba(155, 89, 182, 0.15)";
    ctx.font = "bold 120px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${floor}`, this.width / 2, this.height / 2 + 40);
  }

  drawPlayer(player: BattleEntity, x: number = 150, y: number = 0): void {
    const ctx = this.ctx;
    const groundY = this.height * 0.75;
    const drawY = y || groundY - 80;

    // 玩家身体 (简化像素风格)
    // 头部
    ctx.fillStyle = "#9b59b6";
    ctx.fillRect(x - 12, drawY, 24, 24);
    // 身体
    ctx.fillStyle = "#8e44ad";
    ctx.fillRect(x - 16, drawY + 24, 32, 32);
    // 腿
    ctx.fillStyle = "#6c3483";
    ctx.fillRect(x - 12, drawY + 56, 10, 20);
    ctx.fillRect(x + 2, drawY + 56, 10, 20);
    // 眼睛
    ctx.fillStyle = "#fff";
    ctx.fillRect(x - 6, drawY + 6, 4, 4);
    ctx.fillRect(x + 2, drawY + 6, 4, 4);

    // HP条
    this.drawHpBar(x - 30, drawY - 15, 60, 6, player.hp, player.maxHp, "#2ecc71");

    // 名称
    ctx.fillStyle = "#9b59b6";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(player.name, x, drawY - 22);
  }

  drawEnemy(enemy: BattleEntity | null, x: number = 550, y: number = 0): void {
    if (!enemy) return;
    const ctx = this.ctx;
    const groundY = this.height * 0.75;
    const drawY = y || groundY - 80;
    const scale = enemy.isBoss ? 1.5 : enemy.isElite ? 1.2 : 1;

    ctx.save();
    ctx.translate(x, drawY);
    ctx.scale(scale, scale);

    // 敌人颜色
    const color = enemy.isBoss ? "#e74c3c" : enemy.isElite ? "#e67e22" : "#c0392b";
    const darkColor = enemy.isBoss ? "#c0392b" : enemy.isElite ? "#d35400" : "#962d22";

    // 身体
    ctx.fillStyle = color;
    ctx.fillRect(-16, 0, 32, 32);
    // 头
    ctx.fillStyle = darkColor;
    ctx.fillRect(-12, -20, 24, 20);
    // 眼睛
    ctx.fillStyle = enemy.isBoss ? "#f1c40f" : "#ff6b6b";
    ctx.fillRect(-8, -14, 5, 5);
    ctx.fillRect(3, -14, 5, 5);
    // 腿
    ctx.fillStyle = darkColor;
    ctx.fillRect(-12, 32, 10, 16);
    ctx.fillRect(2, 32, 10, 16);

    // Boss特效
    if (enemy.isBoss) {
      ctx.strokeStyle = `rgba(231, 76, 60, ${0.3 + Math.sin(this.time * 3) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 10, 40, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // HP条
    const hpBarX = x - 30;
    const hpBarY = drawY / scale - 30;
    this.drawHpBar(hpBarX, hpBarY * scale, 60, 6, enemy.hp, enemy.maxHp, "#e74c3c");

    // 名称
    ctx.fillStyle = enemy.isBoss ? "#e74c3c" : enemy.isElite ? "#e67e22" : "#ccc";
    ctx.font = `${enemy.isBoss ? "bold " : ""}12px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(enemy.name, x, drawY - 35);
  }

  private drawHpBar(x: number, y: number, w: number, h: number, current: number, max: number, color: string): void {
    const ctx = this.ctx;
    // 背景
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(x, y, w, h);
    // 血量
    const ratio = Math.max(0, current / max);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * ratio, h);
    // 边框
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, w, h);
  }

  drawAnimations(numbers: DamageNumber[]): void {
    const ctx = this.ctx;
    for (const num of numbers) {
      ctx.fillStyle = `rgba(${this.hexToRgb(num.color)}, ${num.opacity})`;
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(num.text, num.x, num.y);
    }
  }

  drawBattleState(state: BattleState, floor: number): void {
    const ctx = this.ctx;
    if (state === "floor_complete") {
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = "#f1c40f";
      ctx.font = "bold 36px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`第 ${floor} 层 通关!`, this.width / 2, this.height / 2 - 10);
      ctx.fillStyle = "#ccc";
      ctx.font = "16px sans-serif";
      ctx.fillText("点击继续下一层", this.width / 2, this.height / 2 + 30);
    }
    if (state === "defeated") {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = "#e74c3c";
      ctx.font = "bold 36px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("战败", this.width / 2, this.height / 2 - 10);
      ctx.fillStyle = "#ccc";
      ctx.font = "16px sans-serif";
      ctx.fillText("点击重新挑战", this.width / 2, this.height / 2 + 30);
    }
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "255,255,255";
    return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
  }
}

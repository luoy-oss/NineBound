import { Vec2, clamp } from "./types";
import { ARENA, CAMERA } from "./config";

export class Camera {
  pos: Vec2 = { x: ARENA.width / 2, y: ARENA.height / 2 };
  target: Vec2 = { x: ARENA.width / 2, y: ARENA.height / 2 };
  viewWidth: number = 800;
  viewHeight: number = 600;
  shake: Vec2 = { x: 0, y: 0 };
  private shakeDecay: number = 0;

  setViewSize(w: number, h: number) {
    this.viewWidth = w;
    this.viewHeight = h;
  }

  update(dt: number) {
    // Smooth follow
    this.pos.x += (this.target.x - this.pos.x) * CAMERA.smoothing * dt;
    this.pos.y += (this.target.y - this.pos.y) * CAMERA.smoothing * dt;

    // Clamp to arena
    const halfW = this.viewWidth / 2;
    const halfH = this.viewHeight / 2;
    this.pos.x = clamp(this.pos.x, halfW, ARENA.width - halfW);
    this.pos.y = clamp(this.pos.y, halfH, ARENA.height - halfH);

    // Shake decay
    if (this.shakeDecay > 0) {
      this.shakeDecay -= dt;
      this.shake.x = (Math.random() - 0.5) * this.shakeDecay * 20;
      this.shake.y = (Math.random() - 0.5) * this.shakeDecay * 20;
    } else {
      this.shake.x = 0;
      this.shake.y = 0;
    }
  }

  addShake(intensity: number) {
    this.shakeDecay = Math.min(this.shakeDecay + intensity, 0.5);
  }

  worldToScreen(worldPos: Vec2): Vec2 {
    return {
      x: worldPos.x - this.pos.x + this.viewWidth / 2 + this.shake.x,
      y: worldPos.y - this.pos.y + this.viewHeight / 2 + this.shake.y,
    };
  }

  screenToWorld(screenPos: Vec2): Vec2 {
    return {
      x: screenPos.x + this.pos.x - this.viewWidth / 2,
      y: screenPos.y + this.pos.y - this.viewHeight / 2,
    };
  }

  isVisible(worldPos: Vec2, radius: number): boolean {
    const screen = this.worldToScreen(worldPos);
    return (
      screen.x + radius > -50 &&
      screen.x - radius < this.viewWidth + 50 &&
      screen.y + radius > -50 &&
      screen.y - radius < this.viewHeight + 50
    );
  }
}

import { Vec2, vec2Normalize } from "./types";

export class InputManager {
  private keys = new Set<string>();
  private joystickVec: Vec2 = { x: 0, y: 0 };
  private bound: boolean = false;

  bind() {
    if (this.bound) return;
    this.bound = true;
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  unbind() {
    if (!this.bound) return;
    this.bound = false;
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }

  private onKeyDown(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
      e.preventDefault();
    }
    this.keys.add(key);
  }

  private onKeyUp(e: KeyboardEvent) {
    this.keys.delete(e.key.toLowerCase());
  }

  setJoystickVector(vec: Vec2) {
    this.joystickVec = vec;
  }

  getMovementDirection(): Vec2 {
    // Joystick takes priority
    if (this.joystickVec.x !== 0 || this.joystickVec.y !== 0) {
      return vec2Normalize(this.joystickVec);
    }

    let x = 0;
    let y = 0;
    if (this.keys.has("a") || this.keys.has("arrowleft")) x -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) x += 1;
    if (this.keys.has("w") || this.keys.has("arrowup")) y -= 1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) y += 1;

    if (x === 0 && y === 0) return { x: 0, y: 0 };
    return vec2Normalize({ x, y });
  }

  isKeyDown(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }
}

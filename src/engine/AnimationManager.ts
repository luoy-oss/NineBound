export interface DamageNumber {
  text: string;
  x: number;
  y: number;
  opacity: number;
  vy: number;
  lifetime: number;
  color: string;
}

export class AnimationManager {
  private numbers: DamageNumber[] = [];

  addDamage(target: "player" | "enemy", amount: number, x: number, y: number): void {
    const isCrit = amount > 100;
    this.numbers.push({
      text: `-${amount}`,
      x: x + (Math.random() - 0.5) * 40,
      y,
      opacity: 1,
      vy: -60,
      lifetime: 1.0,
      color: target === "enemy" ? (isCrit ? "#ff6b6b" : "#ffd93d") : "#ff4757",
    });
  }

  addText(text: string, x: number, y: number, color: string): void {
    this.numbers.push({
      text,
      x,
      y,
      opacity: 1,
      vy: -40,
      lifetime: 1.5,
      color,
    });
  }

  update(dt: number): void {
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const num = this.numbers[i];
      num.y += num.vy * dt;
      num.lifetime -= dt;
      num.opacity = Math.max(0, num.lifetime);
      if (num.lifetime <= 0) {
        this.numbers.splice(i, 1);
      }
    }
  }

  get active(): DamageNumber[] {
    return this.numbers;
  }

  clear(): void {
    this.numbers = [];
  }
}

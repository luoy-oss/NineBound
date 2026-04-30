import { createHash } from "crypto";

export function generateUid(qq: string): string {
  return createHash("sha256")
    .update(qq + "NineBound")
    .digest("hex")
    .slice(0, 12);
}

export function hashQQ(qq: string): string {
  return createHash("sha256").update(qq).digest("hex");
}

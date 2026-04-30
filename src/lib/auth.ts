import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
const SALT = "NineBound";

export function generateUid(qq: string): string {
  return crypto
    .createHash("sha256")
    .update(qq + SALT)
    .digest("hex")
    .slice(0, 12);
}

export function hashQq(qq: string): string {
  return crypto.createHash("sha256").update(qq).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signJwt(uid: string): string {
  return jwt.sign({ uid }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyJwt(token: string): { uid: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { uid: string };
  } catch {
    return null;
  }
}

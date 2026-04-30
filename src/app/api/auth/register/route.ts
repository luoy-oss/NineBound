import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { generateUid, hashQQ } from "@/lib/crypto";
import { signToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";
import type { UserDoc } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { qq, password } = parsed.data;
    const db = await getDb();
    const users = db.collection<UserDoc>("users");

    const qqHash = hashQQ(qq);
    const existing = await users.findOne({ qqHash });
    if (existing) {
      return NextResponse.json(
        { error: "该QQ号已注册，请直接登录" },
        { status: 409 }
      );
    }

    const uid = generateUid(qq);
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    const newUser: UserDoc = {
      uid,
      qqHash,
      passwordHash,
      nickname: "丧家之犬",
      floor: 1,
      power: 100,
      coins: 0,
      gems: 0,
      equipment: [],
      unlockedSkills: ["slash", "thrust", "burst"],
      createdAt: now,
      updatedAt: now,
    };

    await users.insertOne(newUser);
    const token = await signToken(uid);

    const response = NextResponse.json({
      success: true,
      uid,
      nickname: newUser.nickname,
    });

    response.cookies.set("nb_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: `服务器错误: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { hashQQ } from "@/lib/crypto";
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
    const user = await users.findOne({ qqHash });
    if (!user) {
      return NextResponse.json(
        { error: "账号不存在，请先注册" },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "密码错误" },
        { status: 401 }
      );
    }

    const token = await signToken(user.uid);

    const response = NextResponse.json({
      success: true,
      uid: user.uid,
      nickname: user.nickname,
    });

    response.cookies.set("nb_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}

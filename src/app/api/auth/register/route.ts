import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { generateUid, hashQq, hashPassword, signJwt } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { qq, password } = await req.json();

    if (!qq || !password) {
      return NextResponse.json({ error: "QQ号和密码不能为空" }, { status: 400 });
    }
    if (!/^\d{5,11}$/.test(qq)) {
      return NextResponse.json({ error: "QQ号格式不正确" }, { status: 400 });
    }
    if (password.length < 6 || password.length > 16) {
      return NextResponse.json({ error: "密码长度6-16位" }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection("users");
    const uid = generateUid(qq);

    const existing = await users.findOne({ uid });
    if (existing) {
      return NextResponse.json({ error: "该QQ号已注册，请直接登录" }, { status: 409 });
    }

    const now = new Date();
    const doc = {
      uid,
      qqHash: hashQq(qq),
      passwordHash: await hashPassword(password),
      nickname: "丧家之犬",
      floor: 1,
      power: 100,
      coins: 0,
      gems: 0,
      equipment: [],
      unlockedSkills: ["slash"],
      createdAt: now,
      updatedAt: now,
    };

    await users.insertOne(doc);
    const token = signJwt(uid);
    return NextResponse.json({ uid, jwt: token, nickname: doc.nickname });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}

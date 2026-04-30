import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifyJwt } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const payload = verifyJwt(auth.slice(7));
    if (!payload) {
      return NextResponse.json({ error: "Token无效或已过期" }, { status: 401 });
    }

    const db = await getDb();
    const pending = await db
      .collection("pending_rewards")
      .findOne({ uid: payload.uid, claimed: false });

    if (!pending || pending.coins === 0) {
      return NextResponse.json({ error: "没有待领取的奖励" }, { status: 400 });
    }

    // 生成6位数字token
    const token = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后

    await db.collection("pending_rewards").updateOne(
      { uid: payload.uid, claimed: false },
      { $set: { token, tokenExpiry: expiry } }
    );

    return NextResponse.json({ token, expiry });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}

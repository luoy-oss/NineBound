import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifyJwt } from "@/lib/auth";

export async function GET(req: NextRequest) {
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
    const user = await db.collection("users").findOne({ uid: payload.uid });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 查询待领取奖励
    const pending = await db
      .collection("pending_rewards")
      .findOne({ uid: payload.uid, claimed: false });

    return NextResponse.json({
      uid: user.uid,
      nickname: user.nickname,
      floor: user.floor,
      power: user.power,
      coins: user.coins,
      gems: user.gems,
      equipment: user.equipment,
      unlockedSkills: user.unlockedSkills,
      pendingRewards: pending
        ? { coins: pending.coins, items: pending.items, hasToken: !!pending.token }
        : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}

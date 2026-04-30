import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

// 此接口预留给洛玖Bot调用
export async function POST(req: NextRequest) {
  try {
    const { uid, token } = await req.json();

    if (!uid || !token) {
      return NextResponse.json({ error: "uid和token不能为空" }, { status: 400 });
    }

    const db = await getDb();
    const pending = await db
      .collection("pending_rewards")
      .findOne({ uid, claimed: false });

    if (!pending) {
      return NextResponse.json({ error: "没有待领取的奖励" }, { status: 404 });
    }

    if (!pending.token || pending.token !== token) {
      return NextResponse.json({ error: "领取码错误" }, { status: 400 });
    }

    if (!pending.tokenExpiry || new Date(pending.tokenExpiry) < new Date()) {
      return NextResponse.json({ error: "领取码已过期" }, { status: 400 });
    }

    // 发放奖励到用户账户
    const updateResult = await db.collection("users").updateOne(
      { uid },
      {
        $inc: { coins: pending.coins, gems: 0 },
        $push: { equipment: { $each: pending.items } } as any,
        $set: { updatedAt: new Date() },
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 标记已领取
    await db
      .collection("pending_rewards")
      .updateOne({ uid, claimed: false }, { $set: { claimed: true } });

    return NextResponse.json({
      success: true,
      coins: pending.coins,
      items: pending.items,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}

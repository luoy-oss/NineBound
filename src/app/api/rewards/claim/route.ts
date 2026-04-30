import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/api-helpers";
import { claimSchema } from "@/lib/validators";
import type { UserDoc, PendingRewardDoc } from "@/types/database";

// 此接口预留给洛玖Bot调用
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = claimSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("参数错误");
    }

    const { uid, token } = parsed.data;
    const db = await getDb();
    const users = db.collection<UserDoc>("users");
    const rewards = db.collection<PendingRewardDoc>("pending_rewards");

    const pending = await rewards.findOne({
      uid,
      token,
      claimed: false,
    });

    if (!pending) {
      return errorResponse("无效的领取码", 404);
    }

    if (new Date() > pending.tokenExpiry) {
      return errorResponse("领取码已过期，请重新生成");
    }

    // 标记已领取
    await rewards.updateOne(
      { _id: pending._id },
      { $set: { claimed: true } }
    );

    // 发放奖励到玩家账户
    const updateOps: Record<string, unknown> = {
      $inc: {
        coins: pending.coins,
        gems: pending.items.reduce((sum, item) => {
          if (item.rarity === "legendary") return sum + 3;
          if (item.rarity === "epic") return sum + 2;
          return sum;
        }, 0),
      },
      $set: { updatedAt: new Date() },
    };

    if (pending.items.length > 0) {
      updateOps["$push"] = {
        equipment: { $each: pending.items },
      };
    }

    await users.updateOne({ uid }, updateOps);

    return NextResponse.json({
      success: true,
      coins: pending.coins,
      items: pending.items,
    });
  } catch {
    return errorResponse("服务器错误", 500);
  }
}

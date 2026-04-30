import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedUid, errorResponse } from "@/lib/api-helpers";
import type { UserDoc, PendingRewardDoc } from "@/types/database";

export async function GET() {
  try {
    const uid = await getAuthenticatedUid();
    const db = await getDb();
    const users = db.collection<UserDoc>("users");
    const rewards = db.collection<PendingRewardDoc>("pending_rewards");

    const user = await users.findOne({ uid });
    if (!user) {
      return errorResponse("玩家不存在", 404);
    }

    const pendingRewards = await rewards
      .find({ uid, claimed: false })
      .toArray();

    return NextResponse.json({
      uid: user.uid,
      nickname: user.nickname,
      floor: user.floor,
      power: user.power,
      coins: user.coins,
      gems: user.gems,
      equipment: user.equipment,
      unlockedSkills: user.unlockedSkills,
      pendingRewards: pendingRewards.map((r) => ({
        _id: r._id?.toString(),
        coins: r.coins,
        items: r.items,
        hasToken: !!r.token,
        token: r.token,
        tokenExpiry: r.tokenExpiry,
      })),
    });
  } catch {
    return errorResponse("认证失败", 401);
  }
}

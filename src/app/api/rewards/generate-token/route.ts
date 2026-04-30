import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedUid, errorResponse } from "@/lib/api-helpers";
import { generateToken } from "@/lib/game-engine";
import type { PendingRewardDoc } from "@/types/database";

export async function POST() {
  try {
    const uid = await getAuthenticatedUid();
    const db = await getDb();
    const rewards = db.collection<PendingRewardDoc>("pending_rewards");

    const pending = await rewards.findOne({ uid, claimed: false });
    if (!pending) {
      return errorResponse("没有待领取的奖励");
    }

    const token = generateToken();
    const tokenExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await rewards.updateOne(
      { _id: pending._id },
      { $set: { token, tokenExpiry } }
    );

    return NextResponse.json({
      token,
      expiry: tokenExpiry.toISOString(),
    });
  } catch {
    return errorResponse("服务器错误", 500);
  }
}

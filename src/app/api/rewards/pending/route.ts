import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedUid, errorResponse } from "@/lib/api-helpers";
import type { PendingRewardDoc } from "@/types/database";

export async function GET() {
  try {
    const uid = await getAuthenticatedUid();
    const db = await getDb();
    const rewards = db.collection<PendingRewardDoc>("pending_rewards");

    const pending = await rewards.findOne({ uid, claimed: false });

    if (!pending) {
      return NextResponse.json({
        coins: 0,
        items: [],
        hasToken: false,
        token: null,
        tokenExpiry: null,
      });
    }

    return NextResponse.json({
      coins: pending.coins,
      items: pending.items,
      hasToken: !!pending.token,
      token: pending.token || null,
      tokenExpiry: pending.tokenExpiry || null,
    });
  } catch {
    return errorResponse("认证失败", 401);
  }
}

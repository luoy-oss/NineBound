import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedUid, errorResponse } from "@/lib/api-helpers";
import { floorCompleteSchema } from "@/lib/validators";
import { calculateFloorReward, generateToken } from "@/lib/game-engine";
import type { UserDoc, PendingRewardDoc } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const uid = await getAuthenticatedUid();
    const body = await request.json();
    const parsed = floorCompleteSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("参数错误");
    }

    const { floor } = parsed.data;
    const db = await getDb();
    const users = db.collection<UserDoc>("users");
    const pendingRewards = db.collection<PendingRewardDoc>("pending_rewards");

    const user = await users.findOne({ uid });
    if (!user) {
      return errorResponse("玩家不存在", 404);
    }

    // 验证楼层: 只能完成当前层或下一层
    if (floor < user.floor || floor > user.floor + 1) {
      return errorResponse("楼层数据异常");
    }

    const reward = calculateFloorReward(floor);
    const token = generateToken();

    // 写入待领取奖励 (每个uid只保留一条未领取记录)
    const existingPending = await pendingRewards.findOne({ uid, claimed: false });
    if (existingPending) {
      await pendingRewards.updateOne(
        { _id: existingPending._id },
        {
          $inc: { coins: reward.coins },
          $push: { items: { $each: reward.items } } as Record<string, unknown>,
          $set: {
            token,
            tokenExpiry: new Date(Date.now() + 5 * 60 * 1000),
          },
        }
      );
    } else {
      const pendingDoc: PendingRewardDoc = {
        uid,
        coins: reward.coins,
        items: reward.items,
        token,
        tokenExpiry: new Date(Date.now() + 5 * 60 * 1000),
        claimed: false,
        createdAt: new Date(),
      };
      await pendingRewards.insertOne(pendingDoc);
    }

    // 更新玩家楼层和宝石
    const newFloor = Math.max(floor + 1, user.floor);
    await users.updateOne(
      { uid },
      {
        $set: { floor: newFloor, updatedAt: new Date() },
        $inc: { gems: reward.gems },
      }
    );

    return NextResponse.json({
      success: true,
      newFloor,
      reward: {
        coins: reward.coins,
        items: reward.items,
        gems: reward.gems,
      },
    });
  } catch {
    return errorResponse("服务器错误", 500);
  }
}

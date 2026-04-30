import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifyJwt } from "@/lib/auth";
import { REWARDS, EQUIPMENT_POOL } from "@/lib/game-config";

function randomEquipment(floor: number) {
  const rand = Math.random();
  let pool: any[];
  if (floor >= 100 && rand < 0.1) {
    pool = EQUIPMENT_POOL.epic;
  } else if (floor >= 50 && rand < 0.3) {
    pool = EQUIPMENT_POOL.rare;
  } else {
    pool = EQUIPMENT_POOL.common;
  }
  const item = pool[Math.floor(Math.random() * pool.length)];
  return { ...item, obtainedAt: new Date() };
}

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

    const { floor, coinsEarned, itemsEarned } = await req.json();
    if (typeof floor !== "number" || floor < 1) {
      return NextResponse.json({ error: "层数无效" }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ uid: payload.uid });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 只能完成当前层或下一层
    if (floor !== user.floor && floor !== user.floor + 1) {
      return NextResponse.json({ error: "层数不合法" }, { status: 400 });
    }

    // 计算奖励
    const isBoss = floor % 50 === 0;
    const isElite = floor % 10 === 0 && !isBoss;

    let coins = coinsEarned ?? REWARDS.coinsPerFloor(floor);
    const items: any[] = itemsEarned ? [...itemsEarned] : [];

    if (isBoss) {
      coins *= REWARDS.bossCoinsMult;
      items.push(randomEquipment(floor)); // 稀有装备
    } else if (isElite) {
      coins *= REWARDS.eliteCoinsMult;
      items.push(randomEquipment(floor));
    }

    // 更新用户层数和战力
    const newFloor = Math.max(user.floor, floor + 1);
    const powerIncrease = isBoss ? 50 : isElite ? 20 : 5;
    await db.collection("users").updateOne(
      { uid: payload.uid },
      {
        $set: { floor: newFloor, updatedAt: new Date() },
        $inc: { power: powerIncrease },
      }
    );

    // 写入待领取奖励池（每个uid只保留一条未领取记录）
    const existing = await db
      .collection("pending_rewards")
      .findOne({ uid: payload.uid, claimed: false });

    if (existing) {
      await db.collection("pending_rewards").updateOne(
        { uid: payload.uid, claimed: false },
        {
          $inc: { coins },
          $push: { items: { $each: items } } as any,
          $unset: { token: "", tokenExpiry: "" },
        }
      );
    } else {
      await db.collection("pending_rewards").insertOne({
        uid: payload.uid,
        coins,
        items,
        token: null,
        tokenExpiry: null,
        claimed: false,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({ success: true, newFloor, coinsEarned: coins, itemsEarned: items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}

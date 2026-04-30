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
    const pending = await db
      .collection("pending_rewards")
      .findOne({ uid: payload.uid, claimed: false });

    if (!pending) {
      return NextResponse.json({ coins: 0, items: [], hasToken: false, token: null, tokenExpiry: null });
    }

    const now = new Date();
    const tokenValid = pending.token && pending.tokenExpiry && new Date(pending.tokenExpiry) > now;

    return NextResponse.json({
      coins: pending.coins,
      items: pending.items,
      hasToken: tokenValid,
      token: tokenValid ? pending.token : null,
      tokenExpiry: tokenValid ? pending.tokenExpiry : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}

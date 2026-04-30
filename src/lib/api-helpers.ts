import { cookies } from "next/headers";
import { verifyToken } from "./auth";
import { NextResponse } from "next/server";

export async function getAuthenticatedUid(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("nb_token")?.value;
  if (!token) throw new Error("Not authenticated");
  const { uid } = await verifyToken(token);
  return uid;
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse(data: Record<string, unknown>) {
  return NextResponse.json(data);
}

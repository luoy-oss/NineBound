import { SignJWT, jwtVerify } from "jose";

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET!);
}

export async function signToken(uid: string): Promise<string> {
  return new SignJWT({ uid })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<{ uid: string }> {
  const { payload } = await jwtVerify(token, getSecret());
  return { uid: payload.uid as string };
}

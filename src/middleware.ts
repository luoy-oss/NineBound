import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET!);
}

const protectedRoutes = ["/play", "/player", "/rewards"];
const authRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("nb_token")?.value;

  let isAuthenticated = false;
  if (token) {
    try {
      await jwtVerify(token, getSecret());
      isAuthenticated = true;
    } catch {
      // Token无效或已过期
    }
  }

  if (isAuthenticated && authRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/play", request.url));
  }

  if (!isAuthenticated && protectedRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sprites|api).*)"],
};

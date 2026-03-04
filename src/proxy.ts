import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPaths = ["/dashboard", "/trades", "/journal", "/analytics", "/ai-chat", "/profile", "/settings"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/trades/:path*", "/journal/:path*", "/analytics/:path*", "/ai-chat/:path*", "/profile/:path*", "/settings/:path*"],
};

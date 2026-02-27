// middleware.ts (root)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const isProtected =
    pathname.startsWith("/tracker") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/admin");

  if (!isProtected) return NextResponse.next();

  // NextAuth v5 (Auth.js) cookie names + older next-auth names
  const token =
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + (search || ""));
    return NextResponse.redirect(url);
  }

  // NOTE: We cannot reliably enforce role-based admin access here
  // without importing auth/prisma (would exceed Edge size).
  // We'll enforce role checks server-side in /admin layout/page.

  return NextResponse.next();
}

export const config = {
  matcher: ["/tracker/:path*", "/history/:path*", "/admin/:path*"],
};

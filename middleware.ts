// middleware.ts (root, not inside src)

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const user = req.auth?.user;

  const isProtected =
    nextUrl.pathname.startsWith("/tracker") ||
    nextUrl.pathname.startsWith("/history") ||
    nextUrl.pathname.startsWith("/admin");

  if (!isProtected) return NextResponse.next();

  if (!user) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Optional: protect admin routes
  if (nextUrl.pathname.startsWith("/admin") && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/tracker", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/tracker/:path*", "/history/:path*", "/admin/:path*"],
};

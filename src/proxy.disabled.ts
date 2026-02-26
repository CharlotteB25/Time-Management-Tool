import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const config = {
  matcher: ["/tracker/:path*", "/history/:path*", "/admin/:path*"],
};

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const user = req.auth?.user as undefined | { role?: string };

  const isLoggedIn = !!user;
  const isAdmin = user?.role === "ADMIN";

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (nextUrl.pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/tracker", nextUrl));
  }

  return NextResponse.next();
});

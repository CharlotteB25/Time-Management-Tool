import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const user = req.auth?.user as undefined | { role?: string };

  const isLoggedIn = !!user;
  const isAdmin = user?.role === "ADMIN";

  // Not logged in => force login for protected routes
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Non-admin trying to access /admin
  if (nextUrl.pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/tracker", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/tracker/:path*", "/history/:path*", "/admin/:path*"],
};

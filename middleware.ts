import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const isProtected =
    pathname.startsWith("/tracker") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/admin");

  if (!isProtected) return NextResponse.next();

  const token =
    req.cookies.get("__Secure-next-auth.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + (search || ""));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/tracker/:path*", "/history/:path*", "/admin/:path*"],
};

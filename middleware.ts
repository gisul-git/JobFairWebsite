import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isAdmin = Boolean(req.auth?.user?.isAdmin);
  const isAdminLogin = pathname === "/admin/login";
  const isAdminArea = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (isAdminLogin) {
    return NextResponse.next();
  }

  if (isAdminArea && !isAdmin) {
    const loginUrl = new URL("/admin/login", nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminApi && !isAdmin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

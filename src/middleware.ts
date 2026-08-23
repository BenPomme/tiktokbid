import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (!process.env.ADMIN_PASSWORD?.trim()) {
    return new NextResponse(
      "Admin is not configured (ADMIN_PASSWORD missing). Set ADMIN_PASSWORD in the environment to enable this page.",
      {
        status: 503,
        headers: { "content-type": "text/plain; charset=utf-8" },
      },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

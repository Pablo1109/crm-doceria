import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const publicPaths = ["/login", "/api/login", "/api/register", "/api/health"];
  const isPublic = publicPaths.some((p) => path === p || path.startsWith(`${p}/`));
  if (isPublic) return NextResponse.next();

  const authCookie = request.cookies.get("auth_token")?.value;
  if (!authCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };


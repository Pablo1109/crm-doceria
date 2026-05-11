import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === '/login' || path.startsWith('/api/health')) return NextResponse.next();
  const authCookie = request.cookies.get('auth_token');
  const masterPassword = process.env.MASTER_PASSWORD || '123456';
  if (!authCookie || authCookie.value !== masterPassword) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };

import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protected workspace routes
  const protectedRoutes = ['/dashboard', '/bots', '/inbox', '/customers', '/leads', '/orders', '/products', '/knowledge', '/automations', '/analytics', '/team', '/settings'];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Skip asset files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/public') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Session token check
  const sessionToken = request.cookies.get('kivo_session')?.value;

  if (isProtectedRoute && !sessionToken) {
    // In development mode pass-through if no token yet to facilitate local testing
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.next();
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
import { NextResponse } from 'next/server';
import { verifyMiddlewareToken } from '@/lib/auth/middleware-session';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const protectedRoutes = [
    '/dashboard',
    '/settings',
    '/billing',
    '/workspace',
    '/account',
    '/admin',
  ];

  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get('kivo_session')?.value;

  if (!token) {
    return redirectToLogin(request);
  }

  const session = await verifyMiddlewareToken(token);

  if (!session?.userId || !session?.workspaceId) {
    return redirectToLogin(request);
  }

  return NextResponse.next();
}

function redirectToLogin(request) {
  const loginUrl = new URL('/login', request.url);

  loginUrl.searchParams.set(
    'redirect',
    request.nextUrl.pathname
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/billing/:path*',
    '/workspace/:path*',
    '/account/:path*',
    '/admin/:path*',
  ],
};
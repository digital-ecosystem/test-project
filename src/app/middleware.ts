import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

// Define which routes are protected and which are public
const protectedRoutes = ['/customer/dashboard', '/customer/phase', '/admin/dashboard'];
const publicRoutes = ['/customer/signin', '/admin/signin'];
const adminSignInRoute = '/admin/signin';

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Check if the current route is protected or public
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);

  // Get session cookie
  const cookie = req.cookies.get('session')?.value;
  const session = await decrypt(cookie);
  console.log("🚀 ~ middleware ~ session:", session)

  // Redirect logged-in admin away from admin sign-in page
  if (path === adminSignInRoute && session?.role === 'admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
  }

  // Redirect to /login if not authenticated and trying to access a protected route
  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  // Redirect authenticated users away from public routes
  if (isPublicRoute && session?.userId && !path.startsWith('/customer/dashboard')) {
    return NextResponse.redirect(new URL('/customer/dashboard', req.nextUrl));
  }

  return NextResponse.next();
}

// Apply middleware to all routes except static files and API
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.(png|jpg|jpeg|svg|ico)$).*)'],
};
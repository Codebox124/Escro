// proxy.ts — Next 16's replacement for middleware.ts. It runs on the Node.js
// runtime (middleware defaulted to Edge, which Vercel Services can't deploy).
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Get auth token and user role from cookies
  const token = request.cookies.get('auth-token')?.value;
  const userRole = request.cookies.get('user-role')?.value;

  const { pathname } = request.nextUrl;

  // Define public routes (accessible without authentication)
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/unauthorized',
    '/forgot-password',
    '/landing',
  ];

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  // If user is not authenticated and trying to access a protected route
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    // Add redirect parameter to return user after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and trying to access login/signup, redirect to appropriate dashboard
  if (token && (pathname === '/login' || pathname === '/signup')) {
    // Redirect based on role
    const dashboardMap: Record<string, string> = {
      admin: '/admin',
      seller: '/mystore',
      agency: '/agency',
      courier: '/courier',
      customer: '/dashboard', // or wherever customers should go
    };

    const redirectPath = userRole ? dashboardMap[userRole] || '/dashboard' : '/dashboard';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // Short links like /settings go to the logged-in user's own section.
  const SHORTCUTS: Record<string, Record<string, string>> = {
    '/settings': { admin: '/admin/settings', agency: '/agency/settings', seller: '/mystore/settings', courier: '/courier/settings', customer: '/dashboard' },
    '/profile': { admin: '/admin/settings', agency: '/agency/settings', seller: '/mystore/profile', courier: '/courier/settings', customer: '/dashboard' },
    '/orders': { admin: '/admin', agency: '/agency/projects', seller: '/mystore/orders', courier: '/courier/mydeliveries', customer: '/dashboard/orders' },
  };
  if (token && SHORTCUTS[pathname]) {
    return NextResponse.redirect(new URL(SHORTCUTS[pathname][userRole || ''] || '/dashboard', request.url));
  }

  // Define role-based route protection
  const roleRoutes: Record<string, string[]> = {
    '/admin': ['admin'],
    '/agency': ['agency'],
    '/components': ['admin', 'agency'], // Example: multiple roles allowed
    '/courier': ['courier'],
    '/dashboard': ['admin', 'seller', 'agency', 'courier', 'customer'], // All authenticated users
    '/mystore': ['seller'],
    '/services': ['seller'],
    // Add customer-specific routes here if needed
    // '/orders': ['customer'],
    // '/profile': ['customer', 'seller', 'admin'], // Multiple roles example
  };

  // Check role-based access for protected routes
  for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(route)) {
      // If roles are specified and user doesn't have the required role
      if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      // If roles are specified but user role is not available
      if (allowedRoles.length > 0 && !userRole) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which routes the proxy should run on
export const config = {
  // Match all routes except:
  // - api routes
  // - _next/static (static files)
  // - _next/image (image optimization)
  // - favicon.ico
  // - public folder files
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
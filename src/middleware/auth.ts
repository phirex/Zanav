import { createServerSupabaseClient } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Authentication middleware for Next.js application
 * Handles authentication verification for protected routes
 */
export async function middleware(request: NextRequest) {
  // Create a supabase client for server-side auth
  const supabase = await createServerSupabaseClient();

  // Get the user from the session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user is not authenticated and trying to access a protected route
  if (!session?.user && isProtectedRoute(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

/**
 * Check if a route should be protected
 */
function isProtectedRoute(pathname: string): boolean {
  // Public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/api/auth",
    "/_next",
    "/favicon.ico",
  ];

  // Check if the path starts with any of the public routes
  return !publicRoutes.some((route) => pathname.startsWith(route));
}

/**
 * Define which routes this middleware should run on
 * This is required for Next.js middleware
 */
export const config = {
  // All routes except for static files, api auth routes, etc.
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};

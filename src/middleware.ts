import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname: currentPath, hostname } = request.nextUrl;
  const isApiRoute = currentPath.startsWith("/api/");

  // Skip middleware for static files and assets
  if (
    currentPath.startsWith("/_next") ||
    currentPath.startsWith("/static") ||
    currentPath.includes(".") ||
    currentPath.startsWith("/images/") ||
    currentPath.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Handle kennel subdomains FIRST with explicit rewrite to public site
  if (hostname !== "www.zanav.io" && hostname !== "zanav.io") {
    const subdomain = hostname.split(".")[0];

    // Allow public kennel APIs to pass through
    if (isApiRoute) {
      if (currentPath.startsWith(`/api/kennel-website/public/`)) {
        return NextResponse.next();
      }
      // Everything else under kennel subdomain API should be public-safe by default
      // but explicitly block private app APIs like /api/bookings
      if (currentPath.startsWith("/api/bookings")) {
        return NextResponse.json({ error: "Not available on public kennel site" }, { status: 404 });
      }
      return NextResponse.next();
    }

    // Rewrite kennel root and any non-/kennel path to the public kennel page
    if (!currentPath.startsWith("/kennel/")) {
      const url = request.nextUrl.clone();
      url.pathname = `/kennel/${subdomain}`;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  // Skip middleware for public pages entirely (main domain)
  if (
    currentPath === "/" ||
    currentPath === "/login" ||
    currentPath === "/signup" ||
    currentPath === "/landing" ||
    currentPath.startsWith("/kennel/")
  ) {
    return NextResponse.next();
  }

  // Main domain logic - only for protected routes
  if (hostname === "www.zanav.io" || hostname === "zanav.io") {
    // Skip API routes entirely for now to avoid breaking them
    if (isApiRoute) {
      return NextResponse.next();
    }

    // Presence-based auth check: if any Supabase auth cookie exists, allow
    const base = "sb-nlpsmauwwlnblgwtawbs-auth-token";
    const foundAuthCookie =
      request.cookies.get(base) ||
      request.cookies.get(`${base}.0`) ||
      request.cookies.get(`${base}.1`) ||
      request.cookies.get(`${base}.2`) ||
      request.cookies.get(`${base}.3`) ||
      request.cookies.get(`${base}.4`);

    if (!foundAuthCookie) {
      return NextResponse.redirect(new URL("/landing", request.url));
    }

    // Auth cookie exists -> allow page load (APIs will handle auth precisely)
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks).*)",
  ],
};

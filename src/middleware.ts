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

    if (isApiRoute) {
      if (currentPath.startsWith(`/api/kennel-website/public/`)) {
        return NextResponse.next();
      }
      if (currentPath.startsWith("/api/bookings")) {
        return NextResponse.json({ error: "Not available on public kennel site" }, { status: 404 });
      }
      return NextResponse.next();
    }

    if (!currentPath.startsWith("/kennel/")) {
      const url = request.nextUrl.clone();
      url.pathname = `/kennel/${subdomain}`;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  // Main domain logic
  if (hostname === "www.zanav.io" || hostname === "zanav.io") {
    if (isApiRoute) {
      return NextResponse.next();
    }

    const base = "sb-nlpsmauwwlnblgwtawbs-auth-token";
    const foundAuthCookie =
      request.cookies.get(base) ||
      request.cookies.get(`${base}.0`) ||
      request.cookies.get(`${base}.1`) ||
      request.cookies.get(`${base}.2`) ||
      request.cookies.get(`${base}.3`) ||
      request.cookies.get(`${base}.4`);

    const isAuthed = !!foundAuthCookie;

    // For unauthenticated users on any protected route (including '/') -> redirect to /landing
    const isPublicPath = currentPath === "/landing" || currentPath.startsWith("/login") || currentPath.startsWith("/signup");

    if (!isAuthed && !isPublicPath) {
      return NextResponse.redirect(new URL("/landing", request.url));
    }

    // Allow
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks).*)",
  ],
};

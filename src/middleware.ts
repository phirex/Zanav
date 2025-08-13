import { NextResponse, type NextRequest } from "next/server";

function detectPreferredLanguage(request: NextRequest): "en" | "he" {
  const supported = ["en", "he"] as const;
  const cookieLng = request.cookies.get("i18nextLng")?.value;
  if (cookieLng && supported.includes(cookieLng as any)) {
    return cookieLng as any;
  }

  const accept = request.headers.get("accept-language") || "";
  const ordered = accept
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";q=");
      const q = qPart ? parseFloat(qPart) : 1;
      return { tag: tag.toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q)
    .map((x) => x.tag);

  for (const tag of ordered) {
    if (tag.startsWith("he")) return "he";
    if (tag.startsWith("en")) return "en";
  }

  // Geo-based fallback (e.g., Israel -> he)
  // Note: geo is only populated on some platforms (e.g., Vercel)
  const country = (request as any).geo?.country?.toUpperCase?.();
  if (country === "IL") return "he";

  return "en";
}

export async function middleware(request: NextRequest) {
  const { pathname: currentPath, hostname, searchParams } = request.nextUrl as any;
  const isApiRoute = currentPath.startsWith("/api/");

  // Normalize naked domain to www for app cookies
  if (hostname === "zanav.io") {
    const url = request.nextUrl.clone();
    url.hostname = "www.zanav.io";
    return NextResponse.redirect(url, 308);
  }

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

  const isProdMain = hostname === "www.zanav.io" || hostname === "zanav.io";
  const isLocalMain = hostname === "localhost" || hostname === "127.0.0.1";

  // Handle kennel subdomains FIRST with explicit rewrite to public site (exclude localhost and main domains)
  if (!isProdMain && !isLocalMain) {
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

    // For public kennel site, set language cookie based on kennel setting (if available), URL, cookie, or Accept-Language
    const response = NextResponse.next();
    const url = request.nextUrl;
    const urlLang = url.searchParams.get("lang");
    const supported = ["en", "he"];
    if (urlLang && supported.includes(urlLang)) {
      response.cookies.set("i18nextLng", urlLang, {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    } else if (!request.cookies.get("i18nextLng")?.value) {
      try {
        const apiUrl = new URL(`/api/kennel-website/public/${subdomain}`, url);
        const res = await fetch(apiUrl, { headers: { accept: "application/json" } });
        if (res.ok) {
          const data = await res.json();
          const kennelLang = (data?.defaultLanguage || "").toLowerCase();
          if (kennelLang && supported.includes(kennelLang)) {
            response.cookies.set("i18nextLng", kennelLang, {
              path: "/",
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            });
          } else {
            const chosen = detectPreferredLanguage(request);
            response.cookies.set("i18nextLng", chosen, {
              path: "/",
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            });
          }
        } else {
          const chosen = detectPreferredLanguage(request);
          response.cookies.set("i18nextLng", chosen, {
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          });
        }
      } catch {
        const chosen = detectPreferredLanguage(request);
        response.cookies.set("i18nextLng", chosen, {
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      }
    }

    if (!currentPath.startsWith("/kennel/")) {
      const url2 = request.nextUrl.clone();
      url2.pathname = `/kennel/${subdomain}`;
      return NextResponse.rewrite(url2);
    }

    return response;
  }

  // Main domain logic (www or localhost)
  if (isProdMain || isLocalMain) {
    if (isApiRoute) {
      return NextResponse.next();
    }

    // Ensure language cookie is set before rendering; allow override via ?lang=
    const response = NextResponse.next();
    const url = request.nextUrl;
    const urlLang = url.searchParams.get("lang");
    const supported = ["en", "he"];
    if (urlLang && supported.includes(urlLang)) {
      response.cookies.set("i18nextLng", urlLang, {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    } else if (!request.cookies.get("i18nextLng")?.value) {
      const chosen = detectPreferredLanguage(request);
      response.cookies.set("i18nextLng", chosen, {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    // Detect Supabase auth token cookie for any project (works for local/remote)
    const cookieNames = request.cookies.getAll().map((c) => c.name);
    const isAuthed = cookieNames.some((name) => /^sb-.*-auth-token(?:\.\d+)?$/.test(name));

    const isPublicPath =
      currentPath === "/landing" ||
      currentPath.startsWith("/login") ||
      currentPath.startsWith("/signup") ||
      currentPath.startsWith("/verify-email") ||
      currentPath.startsWith("/auth/callback") ||
      // Allow viewing public kennel pages locally without auth
      currentPath.startsWith("/kennel/");

    if (!isAuthed && !isPublicPath) {
      return NextResponse.redirect(new URL("/landing", request.url));
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks).*)",
  ],
};

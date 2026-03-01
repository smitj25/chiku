// middleware.ts — Auth guard for /dashboard routes
// Runs on the Edge Runtime (Vercel)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// In development, skip auth checks so pages are accessible without a JWT
const DEV_BYPASS = process.env.NODE_ENV === "development";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "sme-plug-dev-secret-change-in-production"
);

const PROTECTED_PATHS = [
    "/dashboard",
    "/marketplace",
    "/plugins",
    "/api-keys",
    "/billing",
    "/settings",
];

const PUBLIC_PATHS = ["/", "/login", "/register", "/pricing", "/docs"];

export async function middleware(request: NextRequest) {
    // In development mode, allow all requests through without auth
    if (DEV_BYPASS) return NextResponse.next();

    const { pathname } = request.nextUrl;

    // Skip API routes and static assets
    if (
        pathname.startsWith("/api/") ||
        pathname.startsWith("/_next/") ||
        pathname.startsWith("/favicon") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // Check if route is protected
    const isProtected = PROTECTED_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    if (!isProtected) {
        return NextResponse.next();
    }

    // Verify session token
    const token = request.cookies.get("sme_session")?.value;

    if (!token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.next();
    } catch {
        // Invalid or expired token
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete("sme_session");
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all paths except:
         * - api routes (handled separately)
         * - _next (internal Next.js)
         * - static files
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};

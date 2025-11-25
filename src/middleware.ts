"use server";
import { auth } from "./lib/auth";
import { NextResponse, NextRequest } from "next/server";
import { isAdmin } from "./lib/checkPermissions";
import { hasVerificationToken } from "./lib/verification";

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
    "/login",
    "/onboarding/verify-invite",
];

/**
 * Routes that require verification token but not authentication
 */
const VERIFICATION_REQUIRED_ROUTES = [
    "/onboarding/create-account",
];

/**
 * Admin-only routes
 */
const ADMIN_ROUTES = ["/admin"];

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const session = await auth.api.getSession({ headers: req.headers });

    // Allow public routes
    if (PUBLIC_ROUTES.includes(path)) {
        return NextResponse.next();
    }

    // Check authentication for protected routes
    if (!session) {
        // Not logged in - redirect to login
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Check verification token requirement for registration routes
    if (VERIFICATION_REQUIRED_ROUTES.includes(path)) {
        const hasToken = hasVerificationToken(req);
        if (!hasToken) {
            // No verification token - redirect to verify-invite
            return NextResponse.redirect(
                new URL("/onboarding/verify-invite", req.url)
            );
        }
    }

    // Check admin access for admin routes
    if (ADMIN_ROUTES.some((route) => path.startsWith(route))) {
        const userIsAdmin = await isAdmin(session.user.id);
        if (!userIsAdmin) {
            // Not an admin - redirect to home
            return NextResponse.redirect(new URL("/", req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    runtime: "nodejs",
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
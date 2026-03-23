import { auth } from "./lib/auth";
import { isAdmin } from "./lib/checkPermissions";
import { NextResponse, NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/onboarding/verify-invite"];
const ADMIN_ROUTE = "/admin";
const OVERVIEW_ROUTE = "/reports/overview";

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    if (PUBLIC_ROUTES.includes(path)) {
        return NextResponse.next();
    }
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const isAdminRoute =
        path === ADMIN_ROUTE || path.startsWith(`${ADMIN_ROUTE}/`);
    if (isAdminRoute) {
        const userIsAdmin = await isAdmin(session.user.id);
        if (!userIsAdmin) {
            return NextResponse.redirect(new URL(OVERVIEW_ROUTE, req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    runtime: "nodejs",
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};

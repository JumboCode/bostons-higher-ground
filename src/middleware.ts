"use server";
import { auth } from "./lib/auth";
import { NextResponse, NextRequest } from "next/server";
import { isAdmin } from "./lib/checkPermissions";
import { hasVerificationToken } from "./lib/verification";

const PUBLIC_ROUTES = ["/login", "/onboarding/verify-invite"];

const VERIFICATION_REQUIRED_ROUTES = ["/onboarding/create-account"];

const ADMIN_ROUTES = ["/admin"];

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    if (PUBLIC_ROUTES.includes(path)) {
        return NextResponse.next();
    }
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (VERIFICATION_REQUIRED_ROUTES.includes(path)) {
        const hasToken = hasVerificationToken(req);
        if (!hasToken) {
            return NextResponse.redirect(
                new URL("/onboarding/verify-invite", req.url)
            );
        }
    }

    // if (ADMIN_ROUTES.some((route) => path.startsWith(route))) {
    //     const userIsAdmin = await isAdmin(session.user.id);
    //     if (!userIsAdmin) {
    //         return NextResponse.redirect(new URL("/", req.url));
    //     }
    // }

    return NextResponse.next();
}

// export const config = {
//     runtime: "nodejs",
//     matcher: [
//         "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
//     ],
// };

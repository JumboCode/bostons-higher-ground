"use server";
import { getUserPermission } from "./lib/usersFunction";
import { auth } from "./lib/auth";
import { NextResponse, NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    const session = await auth.api.getSession({headers: (req.headers)});
    const path = req.nextUrl.pathname;


    if (!session && path != "/login") {
        return NextResponse.redirect(new URL("/login", req.url))
    }

    return NextResponse.next();
}

export const config = {
    runtime: "nodejs",
    matcher: ["/", "/onboarding/:path*", "/weather"],
  // TODO config matcher 
}
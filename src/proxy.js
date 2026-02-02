import { NextResponse } from "next/server";
import { requireAuth } from "./lib/auth/requireAuth";

export async function proxy(req) {
    const pathname = req.nextUrl.pathname;

    let isAuthenticated = false;
    try {
        await requireAuth();
        isAuthenticated = true;
    } catch (err) {
        isAuthenticated = false;
    }

    if (isAuthenticated && (pathname === "/login" || pathname === "/sign-up")) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    const protectedRoutes = ["/"];
    if (!isAuthenticated && protectedRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
    ],
};
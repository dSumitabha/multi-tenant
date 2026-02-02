import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
    try {
        const cookieStore = await cookies();

        // Clear the auth_token cookie
        cookieStore.set("auth_token", "", {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            maxAge: 0, // expire immediately
        });

        return NextResponse.json({ message: "Logged out successfully." });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error! Please try again." },
            { status: 500 }
        );
    }
}
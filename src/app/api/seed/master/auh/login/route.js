import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getMasterConnection } from "@/lib/db/masterDbConnect";
import { getUserModel } from "@/models/User";
import { signJwt } from "@/lib/auth/signJwt";

export async function POST(req) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
            { error: "Email and password required" },
            { status: 400 }
            );
        }

        const conn = await getMasterConnection();
        const User = getUserModel(conn);

        const user = await User.findOne({ email, isActive: true }).lean();
        if (!user) {
            return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
            );
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
            );
        }

        const token = await signJwt({
            userId: user._id.toString(),
            tenantId: user.tenantId.toString(),
            role: user.role,
        });

        return NextResponse.json({
            token,
            user: {
            id: user._id,
            role: user.role,
            tenantId: user.tenantId,
            },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
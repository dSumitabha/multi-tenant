import { cookies } from "next/headers";
import { verifyJwt } from "./verifyJwt";

export async function requireAuth() {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
        const err = new Error("UNAUTHORIZED");
        err.status = 401;
        throw err;
    }

    try {
        const payload = await verifyJwt(token);

        return {
            userId: payload.userId,
            tenantId: payload.tenantId,
            role: payload.role,
        };
    } catch {
        const err = new Error("INVALID_TOKEN");
        err.status = 401;
        throw err;
    }
}
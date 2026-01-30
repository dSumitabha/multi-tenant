import { cookies } from "next/headers";
import { verifyJwt } from "./verifyJwt";

export async function requireAuth() {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
        throw new Error("UNAUTHORIZED");        
    }

    try {
        const payload = await verifyJwt(token);

        return {
            userId: payload.userId,
            tenantId: payload.tenantId,
            role: payload.role,
        };
    } catch (err) {
        throw new Error("INVALID_TOKEN");
    }
}
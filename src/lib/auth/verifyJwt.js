import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function verifyJwt(token) {
    if (!token) throw new Error("Token missing");

    const { payload } = await jwtVerify(token, secret);
    return payload; // { userId, tenantId, role }
}
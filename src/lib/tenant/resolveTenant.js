import { getMasterConnection } from "@/lib/db/masterDbConnect";
import { getTenantModel } from "@/models/Tenant";

const tenantCache = new Map();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function resolveTenant(tenantId) {
    const cached = tenantCache.get(tenantId);

    if (cached && cached.expiresAt > Date.now()) {
        return cached;
    }

    const conn = await getMasterConnection();
    const Tenant = getTenantModel(conn);

    const tenant = await Tenant.findById(tenantId).lean();

    if (!tenant || tenant.status !== "active") {
        throw new Error("TENANT_INACTIVE");
    }

    const value = {
        dbName: tenant.dbName,
        status: tenant.status,
        expiresAt: Date.now() + CACHE_TTL,
    };

    tenantCache.set(tenantId, value);

    return value;
}
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireRole } from "@/lib/auth/requireRole";
import { getTenantConnection } from "@/lib/db/tenantDbConnect";
import { getSupplierModel } from "@/models/Supplier";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

export async function GET() {
    try {
        const { tenantId, role } = await requireAuth();

        requireRole(role, ["owner", "manager", "staff"]);

        const { dbName } = await resolveTenant(tenantId);
        
        const tenantConn = await getTenantConnection(dbName);
        const Supplier = getSupplierModel(tenantConn);

        const suppliers = await Supplier.find({ isActive: true }).lean();

        return NextResponse.json(suppliers, { status: 200 });

    } catch (err) {
        const status = err.status || 500;

        return NextResponse.json(
            {
                error: err.message || "INTERNAL_ERROR",
            },
            { status }
        );
    }
}
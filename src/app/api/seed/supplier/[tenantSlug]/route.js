import { NextResponse } from "next/server";
import { getMasterConnection } from "@/lib/db/masterDbConnect";
import { getTenantModel } from "@/models/Tenant";
import { getSupplierModel } from "@/models/Supplier";
import { getTenantConnection } from "@/lib/db/tenantDbConnect";
import suppliers from "@/seeders/Supplier";

export async function GET(_req, { params }) {
    const { tenantSlug } = await params;

    const masterConn = await getMasterConnection();
    const TenantModel = getTenantModel(masterConn);

    const tenant = await TenantModel.findOne({ slug: tenantSlug });

    if (!tenant) {
        return NextResponse.json(
            { message: "Tenant not found" },
            { status: 404 }
        );
    }

    const tenantConn = await getTenantConnection(tenant.dbName);

    const SupplierModel = getSupplierModel(tenantConn);

    await SupplierModel.insertMany(suppliers);

    return NextResponse.json({
        message: `Suppliers seeded successfully for tenant: ${tenantSlug} in DB: ${tenant.dbName}`
    });
}
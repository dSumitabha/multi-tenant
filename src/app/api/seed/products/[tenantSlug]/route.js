import { NextResponse } from "next/server";
import { getMasterConnection } from "@/lib/db/masterDbConnect";
import { getTenantModel } from "@/models/Tenant";
import { getProductModel } from "@/models/Product";
import { getTenantConnection } from "@/lib/db/tenantDbConnect";
import products from "@/seeders/Products";

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

    const ProductModel = getProductModel(tenantConn);

    await ProductModel.insertMany(products);

    return NextResponse.json({
        message: `Products seeded successfully for tenant: ${tenantSlug}`
    });
}
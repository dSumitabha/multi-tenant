import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireRole } from "@/lib/auth/requireRole";
import { getTenantConnection } from "@/lib/db/tenantDbConnect";
import { getProductModel } from "@/models/Product";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

export async function POST(req) {
    try {
        const { userId, tenantId, role } = await requireAuth();

        requireRole(role, ["owner"]);

        const payload = await req.json();

        if (!payload?.name || !payload?.variants?.length) {
            return NextResponse.json(
                { error: "Product name and variants are required" },
                { status: 400 }
            );
        }

        const { dbName } = await resolveTenant(tenantId);

        const tenantConn = await getTenantConnection(dbName);

        const Product = getProductModel(tenantConn);

        const product = await Product.create({
            ...payload,
            createdBy: userId,
        });

        return NextResponse.json(product, { status: 201 });
    } catch (err) {
        if (err.status === 403) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create product" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const { tenantId, role } = await requireAuth();

        requireRole(role, ["owner", "manager", "staff"]);

        const { dbName } = await resolveTenant(tenantId);
        
        const tenantConn = await getTenantConnection(dbName);
        const Product = getProductModel(tenantConn);

        const products = await Product.find({ isActive: true }).lean();

        return NextResponse.json(products, { status: 200 });

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
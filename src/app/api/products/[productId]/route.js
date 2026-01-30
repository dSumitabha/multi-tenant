import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireRole } from "@/lib/auth/requireRole";
import { getTenantConnection } from "@/lib/db/tenantDbConnect";
import { getProductModel } from "@/models/Product";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

export async function GET(req, { params }) {
    try {
        const { tenantId, role } = await requireAuth();

        requireRole(role, ["owner", "manager", "staff"]);

        const { dbName } = await resolveTenant(tenantId);

        const tenantConn = await getTenantConnection(dbName);

        const Product = getProductModel(tenantConn);

        const { productId } = await params;
        console.log(productId)

        const product = await Product.findOne({
            _id: productId,
            isActive: true
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(product);
    } catch (err) {
        if (err.status === 403) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: "Failed to fetch product, please try again" },
            { status: 500 }
        );
    }
}

export async function PUT(req, { params }) {
    try {
        const { tenantId, role } = await requireAuth();

        requireRole(role, ["owner", "manager"]);

        const updates = await req.json();

        const { dbName } = await resolveTenant(tenantId);

        const tenantConn = await getTenantConnection(dbName);

        const Product = getProductModel(tenantConn);

        const { productId } = await params;

        const updated = await Product.findByIdAndUpdate(
            productId,
            updates,
            { new: true }
        );

        if (!updated) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(updated);
    } catch (err) {
        if (err.status === 403) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: "Failed to update product" },
            { status: 500 }
        );
    }
}

export async function DELETE(req, { params }) {
    try {
        const { tenantId, role } = await requireAuth();
        requireRole(role, ["owner", "manager"]);

        const { dbName } = await resolveTenant(tenantId);

        const tenantConn = await getTenantConnection(dbName);

        const Product = getProductModel(tenantConn);

        const { productId } = await params;

        const deleted = await Product.findByIdAndUpdate(
            productId,
            { isDeleted: true },
            { new: true }
        );

        if (!deleted) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        if (err.status === 403) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(
            { error: "Failed to delete product" },
            { status: 500 }
        );
    }
}
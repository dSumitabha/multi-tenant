import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireRole } from "@/lib/auth/requireRole";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { getTenantConnection } from "@/lib/db/tenantDbConnect";
import { getProductModel } from "@/models/Product";
import { getStockMovementModel } from "@/models/StockMovement";
import { getStockSnapshotModel } from "@/models/StockSnapshot";

export async function POST(req) {
    try {
        const { tenantId, role } = await requireAuth();
        requireRole(role, ["owner", "manager", "staff"]);

        const body = await req.json();
        const { productId, variantId, quantity, sourceId = null } = body;

        if (!productId || !variantId || !quantity || quantity <= 0) {
            return NextResponse.json(
                { error: "Invalid request data" },
                { status: 400 }
            );
        }

        const { dbName } = await resolveTenant(tenantId);
        const tenantConn = await getTenantConnection(dbName);

        const Product = getProductModel(tenantConn);
        const StockMovement = getStockMovementModel(tenantConn);
        const StockSnapshot = getStockSnapshotModel(tenantConn);

        const product = await Product.findOne({
            _id: productId,
            isActive: true,
            "variants._id": variantId
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product or variant not found" },
                { status: 404 }
            );
        }

        const variant = product.variants.id(variantId);

        if (!variant.isActive) {
            return NextResponse.json(
                { error: "Variant is inactive" },
                { status: 400 }
            );
        }

        variant.stock += quantity;
        await product.save();

        await StockSnapshot.findOneAndUpdate(
            { productId, variantId },
            {
                $set: { availableQty: variant.stock }
            },
            { upsert: true, new: true }
        );

        await StockMovement.create({
            productId,
            variantId,
            direction: "IN",
            quantity,
            reason: "PURCHASE",
            sourceType: "PO",
            sourceId
        });

        return NextResponse.json({
            success: true,
            currentStock: variant.stock
        });
    } catch (err) {
        if (err.status === 403) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: "Failed to process purchase order" },
            { status: 500 }
        );
    }
}
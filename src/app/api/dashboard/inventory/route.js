import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireRole } from "@/lib/auth/requireRole";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { getTenantConnection } from "@/lib/db/tenantDbConnect";

export async function GET(req) {
    try {
        const { tenantId, role } = await requireAuth();
        requireRole(role, ["owner", "manager", "staff"]);

        const { dbName } = await resolveTenant(tenantId);
        const tenantConn = await getTenantConnection(dbName);

        let StockSnapshot = tenantConn.models.StockSnapshot;
        if (!StockSnapshot) {
            const module = await import("@/models/StockSnapshot");
            StockSnapshot = module.getStockSnapshotModel(tenantConn);
        }

        let Product = tenantConn.models.Product;
        if (!Product) {
            const module = await import("@/models/Product");
            Product = module.getProductModel(tenantConn);
        }

        let PurchaseOrder = tenantConn.models.PurchaseOrder;
        if (!PurchaseOrder) {
            const module = await import("@/models/PurchaseOrder");
            PurchaseOrder = module.getPurchaseOrderModel(tenantConn);
        }

        let SalesOrder = tenantConn.models.SalesOrder;
        if (!SalesOrder) {
            const module = await import("@/models/SalesOrder");
            SalesOrder = module.getSalesOrderModel(tenantConn);
        }

        const snapshots = await StockSnapshot.find().lean();

        const items = [];
        let totalInventoryValue = 0;

        for (const snap of snapshots) {
            const product = await Product.findById(snap.productId).lean();
            if (!product) continue;

            const variant = product.variants.find(
                v => v._id.toString() === snap.variantId.toString()
            );
            if (!variant) continue;

            // ---- Pending Purchase Orders ----
            const pos = await PurchaseOrder.find({
                status: { $in: ["SENT", "CONFIRMED"] },
                "items.variantId": snap.variantId
            }).lean();

            let pendingPOQty = 0;
            for (const po of pos) {
                for (const item of po.items) {
                    if (item.variantId.toString() === snap.variantId.toString()) {
                        pendingPOQty += item.orderedQty - item.receivedQty;
                    }
                }
            }

            const sos = await SalesOrder.find({
                status: "CONFIRMED",
                "items.variantId": snap.variantId
            }).lean();

            let pendingSOQty = 0;
            for (const so of sos) {
                for (const item of so.items) {
                    if (item.variantId.toString() === snap.variantId.toString()) {
                        pendingSOQty += item.orderedQty - item.fulfilledQty;
                    }
                }
            }

            const inventoryValue = snap.availableQty * variant.price;
            totalInventoryValue += inventoryValue;

            items.push({
                productId: product._id,
                productName: product.name,
                variantId: variant._id,
                sku: variant.sku,
                availableQty: snap.availableQty,
                pendingPOQty,
                pendingSOQty,
                unitPrice: variant.price,
                inventoryValue
            });
        }

        return NextResponse.json({
            items,
            totalInventoryValue
        });
    } catch (err) {
        console.error("Inventory dashboard error:", err);
        return NextResponse.json(
            { error: err.message || "Failed to fetch inventory dashboard" },
            { status: err.status || 500 }
        );
    }
}
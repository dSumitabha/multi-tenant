import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireRole } from "@/lib/auth/requireRole";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { getTenantConnection } from "@/lib/db/tenantDbConnect";

import StockMovementSchema from "@/models/StockMovementSchema";

export async function GET(req) {
    try {
        const { tenantId, role } = await requireAuth();
        requireRole(role, ["owner", "manager", "staff"]);

        const { dbName } = await resolveTenant(tenantId);
        const tenantConn = await getTenantConnection(dbName);

        // Dynamic model resolution
        const StockMovement =
            tenantConn.models.StockMovement ||
            tenantConn.model("StockMovement", StockMovementSchema);
        const Product = tenantConn.models.Product || (await import("@/models/Product")).then(m => m.getProductModel(tenantConn));
        const SalesOrder = tenantConn.models.SalesOrder || (await import("@/models/SalesOrder")).then(m => m.getSalesOrderModel(tenantConn));
        const PurchaseOrder = tenantConn.models.PurchaseOrder || (await import("@/models/PurchaseOrder")).then(m => m.getPurchaseOrderModel(tenantConn));

        const url = new URL(req.url);
        const productId = url.searchParams.get("productId");
        const variantId = url.searchParams.get("variantId");

        const filter = {};
        if (productId) filter.productId = productId;
        if (variantId) filter.variantId = variantId;

        const movements = await StockMovement.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        // Enrich movements with product/variant info
        const enrichedMovements = await Promise.all(
            movements.map(async m => {
                const product = m.productId ? await Product.findById(m.productId).lean() : null;
                const variant = product?.variants?.find(v => v._id.toString() === m.variantId?.toString()) || null;
                
                let sourceData = null;

                if (m.sourceType === "PO" && m.sourceId) {
                    const po = await PurchaseOrder.findById(m.sourceId).lean();
                    const supplier = po?.supplierId ? await tenantConn.model("Supplier").findById(po.supplierId).lean() : null;
                    sourceData = {
                        type: "PO",
                        id: m.sourceId,
                        supplierName: supplier?.name || null,
                        poStatus: po?.status || null
                    };
                }

                if (m.sourceType === "SO" && m.sourceId) {
                    const so = await SalesOrder.findById(m.sourceId).lean();
                    sourceData = {
                        type: "SO",
                        id: m.sourceId,
                        customerName: so?.customerName || null,
                        soStatus: so?.status || null
                    };
                }

                return {
                    ...m,
                    product: product ? { _id: product._id, name: product.name } : null,
                    variant: variant
                        ? {
                              _id: variant._id,
                              sku: variant.sku,
                              price: variant.price,
                              attributes: variant.attributes || null
                          }
                        : null,
                    source: sourceData
                };
            })
        );

        return NextResponse.json(enrichedMovements);
    } catch (err) {
        console.error("Stock movement fetch error:", err);
        return NextResponse.json(
            { error: err.message || "Failed to fetch stock movements" },
            { status: err.status || 500 }
        );
    }
}
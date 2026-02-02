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

        // Dynamic model resolution
        let StockMovement = tenantConn.models.StockMovement
        if(!StockMovement){
            const module = await import("@/models/StockMovement");
            StockMovement = module.getStockMovementModel(tenantConn);
        }

        let Product = tenantConn.models.Product;
        if (!Product) {
            const module = await import("@/models/Product");
            Product = module.getProductModel(tenantConn);
        }
        
        let SalesOrder = tenantConn.models.SalesOrder;

        if(!SalesOrder){
            const module = await import("@/models/SalesOrder");
            SalesOrder = module.getSalesOrderModel(tenantConn);
        }


        let PurchaseOrder = tenantConn.models.PurchaseOrder;

        if (!PurchaseOrder) {
            const module = await import("@/models/PurchaseOrder");
            PurchaseOrder = module.getPurchaseOrderModel(tenantConn);
        }
        
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
                    let Supplier = tenantConn.models.Supplier;

                    if (!Supplier) {
                        const module = await import("@/models/Supplier");
                        Supplier = module.getSupplierModel(tenantConn);
                    }
                    if (m.sourceType === "PO" && m.sourceId) {
                        const po = await PurchaseOrder.findById(m.sourceId).lean();
                    
                        const supplier = po?.supplierId
                            ? await Supplier.findById(po.supplierId).lean()
                            : null;
                    }
                    
                    sourceData = {
                        type: "PO",
                        id: m.sourceId,
                        supplierName: Supplier?.name || null,
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
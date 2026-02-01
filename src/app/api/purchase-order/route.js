import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireRole } from "@/lib/auth/requireRole";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { getTenantConnection } from "@/lib/db/tenantDbConnect";
import { getPurchaseOrderModel } from "@/models/PurchaseOrder";
import { getSupplierModel } from "@/models/Supplier";

export async function POST(req) {
    try {
        const { tenantId, role } = await requireAuth();
        requireRole(role, ["owner", "manager"]);

        const body = await req.json();
        const { supplierId, items } = body;

        if (!supplierId || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "Invalid purchase order data" },
                { status: 400 }
            );
        }

        const { dbName } = await resolveTenant(tenantId);
        const tenantConn = await getTenantConnection(dbName);

        const Supplier = getSupplierModel(tenantConn);
        const PurchaseOrder = getPurchaseOrderModel(tenantConn);

        const supplier = await Supplier.findOne({
            _id: supplierId,
            isActive: true
        });

        if (!supplier) {
            return NextResponse.json(
                { error: "Supplier not found" },
                { status: 404 }
            );
        }

        const po = await PurchaseOrder.create({
            supplierId,
            status: "DRAFT",
            items: items.map(item => ({
                productId: item.productId,
                variantId: item.variantId,
                orderedQty: item.orderedQty,
                unitPrice: item.unitPrice
            }))
        });

        return NextResponse.json({
            success: true,
            purchaseOrderId: po._id
        });
    } catch (err) {
        return NextResponse.json(
            { error: err.message || "Failed to create purchase order" },
            { status: err.status || 500 }
        );
    }    
}
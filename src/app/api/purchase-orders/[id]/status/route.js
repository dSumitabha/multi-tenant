import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { requireAuth } from "@/lib/auth/requireAuth";
import { requireRole } from "@/lib/auth/requireRole";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { getTenantConnection } from "@/lib/db/tenantDbConnect";

import { getPurchaseOrderModel } from "@/models/PurchaseOrder";
import { applyStockChange } from "@/lib/inventory/applyStockChange";

const STATUS_FLOW = {
    DRAFT: "SENT",
    SENT: "CONFIRMED",
    CONFIRMED: "RECEIVED"
};

export async function PATCH(req, { params }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { tenantId, role } = await requireAuth();
        requireRole(role, ["owner", "manager"]);

        const { id } = params;
        const body = await req.json();

        if (body.action !== "NEXT") {
            return NextResponse.json(
                { error: "Invalid action" },
                { status: 400 }
            );
        }

        const { dbName } = await resolveTenant(tenantId);
        const tenantConn = await getTenantConnection(dbName);

        const PurchaseOrder = getPurchaseOrderModel(tenantConn);

        const po = await PurchaseOrder.findById(id).session(session);

        if (!po) {
            return NextResponse.json(
                { error: "Purchase order not found" },
                { status: 404 }
            );
        }

        const nextStatus = STATUS_FLOW[po.status];

        if (!nextStatus) {
            return NextResponse.json(
                { error: "No further status transition allowed" },
                { status: 400 }
            );
        }

        // i will update the stock on recipt only
        if (po.status === "CONFIRMED" && nextStatus === "RECEIVED") {
            for (const item of po.items) {
                await applyStockChange({
                    tenantConn,
                    productId: item.productId,
                    variantId: item.variantId,
                    direction: "IN",
                    quantity: item.orderedQty,
                    reason: "PURCHASE",
                    sourceType: "PO",
                    sourceId: po._id,
                    idempotencyKey: `PO:${po._id}:${item.productId}:${item.variantId}`
                });
            }
        }

        po.status = nextStatus;
        await po.save({ session });

        await session.commitTransaction();
        session.endSession();

        return NextResponse.json({
            success: true,
            status: po.status
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        return NextResponse.json(
            { error: err.message || "Failed to update PO status" },
            { status: err.status || 500 }
        );
    }
}
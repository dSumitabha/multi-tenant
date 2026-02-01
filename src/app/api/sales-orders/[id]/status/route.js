import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/requireAuth";
import { requireRole } from "@/lib/auth/requireRole";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { getTenantConnection } from "@/lib/db/tenantDbConnect";

import { getSalesOrderModel } from "@/models/SalesOrder";
import { applyStockChange } from "@/lib/inventory/applyStockChange";

const STATUS_FLOW = {
    DRAFT: "CONFIRMED",
    CONFIRMED: "FULFILLED",
    FULFILLED: "RETURNED"
};

export async function PATCH(req, { params }) {
    let session;

    try {
        const { tenantId, role } = await requireAuth();
        requireRole(role, ["owner", "manager"]);

        const { id } = await params;
        const body = await req.json();

        if (body.action !== "NEXT") {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const { dbName } = await resolveTenant(tenantId);
        const tenantConn = await getTenantConnection(dbName);

        session = await tenantConn.startSession();
        session.startTransaction();

        const SalesOrder = getSalesOrderModel(tenantConn);
        const so = await SalesOrder.findById(id).session(session);

        if (!so) {
            return NextResponse.json({ error: "Sales order not found" }, { status: 404 });
        }

        const nextStatus = STATUS_FLOW[so.status];
        if (!nextStatus) {
            return NextResponse.json(
                { error: "No further status transition allowed" },
                { status: 400 }
            );
        }

        // Update stock only on FULFILLED or RETURNED
        if (nextStatus === "FULFILLED") {
            for (const item of so.items) {
                await applyStockChange({
                    tenantConn,
                    productId: item.productId,
                    variantId: item.variantId,
                    direction: "OUT",
                    quantity: item.orderedQty,
                    reason: "SALE",
                    sourceType: "SO",
                    sourceId: so._id,
                    idempotencyKey: `SO:${so._id}:${item.productId}:${item.variantId}`
                });
            }
        } else if (nextStatus === "RETURNED") {
            for (const item of so.items) {
                await applyStockChange({
                    tenantConn,
                    productId: item.productId,
                    variantId: item.variantId,
                    direction: "IN",
                    quantity: item.orderedQty,
                    reason: "RETURN",
                    sourceType: "SO",
                    sourceId: so._id,
                    idempotencyKey: `SO_RETURN:${so._id}:${item.productId}:${item.variantId}`
                });
            }
        }

        so.status = nextStatus;
        await so.save({ session });

        await session.commitTransaction();
        session.endSession();

        return NextResponse.json({
            success: true,
            status: so.status
        });
    } catch (err) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }

        return NextResponse.json(
            { error: err.message || "Failed to update sales order status" },
            { status: err.status || 500 }
        );
    }
}
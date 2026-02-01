import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/requireAuth";
import { requireRole } from "@/lib/auth/requireRole";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { getTenantConnection } from "@/lib/db/tenantDbConnect";

import { getSalesOrderModel } from "@/models/SalesOrder";

export async function POST(req) {
    try {
        const { tenantId, role } = await requireAuth();
        requireRole(role, ["owner", "manager"]);

        const body = await req.json();
        const { customerName, items } = body;

        if (!customerName || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "Invalid sales order data" },
                { status: 400 }
            );
        }

        const { dbName } = await resolveTenant(tenantId);
        const tenantConn = await getTenantConnection(dbName);

        const SalesOrder = getSalesOrderModel(tenantConn);

        const so = await SalesOrder.create({
            customerName,
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
            salesOrderId: so._id
        });
    } catch (err) {
        return NextResponse.json(
            { error: err.message || "Failed to create sales order" },
            { status: err.status || 500 }
        );
    }
}
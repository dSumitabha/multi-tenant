import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/requireAuth";
import { requireRole } from "@/lib/auth/requireRole";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { getTenantConnection } from "@/lib/db/tenantDbConnect";

import { getSalesOrderModel } from "@/models/SalesOrder";

export async function POST(req) {
    try {
        const { tenantId, role } = await requireAuth();
        requireRole(role, ["owner"]);

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

export async function GET() {
    try {
        const { tenantId, role } = await requireAuth();
        requireRole(role, ["owner", "manager", "staff"]);

        const { dbName } = await resolveTenant(tenantId);
        const tenantConn = await getTenantConnection(dbName);

        const SalesOrder = getSalesOrderModel(tenantConn);

        const salesOrders = await SalesOrder.aggregate([
            { $sort: { createdAt: -1 } },

            { $unwind: "$items" },

            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },

            {
                $addFields: {
                    variant: {
                        $first: {
                            $filter: {
                                input: "$product.variants",
                                as: "v",
                                cond: {
                                    $eq: ["$$v._id", "$items.variantId"]
                                }
                            }
                        }
                    }
                }
            },

            {
                $group: {
                    _id: "$_id",
                    customerName: { $first: "$customerName" },
                    status: { $first: "$status" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$updatedAt" },
                    items: {
                        $push: {
                            productId: "$items.productId",
                            productName: "$product.name",
                            variantId: "$items.variantId",
                            variantSku: "$variant.sku",
                            variantAttributes: "$variant.attributes",
                            orderedQty: "$items.orderedQty",
                            fulfilledQty: "$items.fulfilledQty",
                            unitPrice: "$items.unitPrice"
                        }
                    }
                }
            }
        ]);

        return NextResponse.json(salesOrders);
    } catch (err) {
        return NextResponse.json(
            { error: err.message || "Failed to fetch sales orders" },
            { status: err.status || 500 }
        );
    }
}
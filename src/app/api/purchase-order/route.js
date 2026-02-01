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

export async function GET(req) {
    try {
        const { tenantId, role } = await requireAuth();
        requireRole(role, ["owner", "manager", "staff"]);

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        const { dbName } = await resolveTenant(tenantId);
        const tenantConn = await getTenantConnection(dbName);

        const PurchaseOrder = getPurchaseOrderModel(tenantConn);

        const matchStage = {};
        if (status) matchStage.status = status;

        const pipeline = [
            { $match: matchStage },

            /* ---- supplier join ---- */
            {
                $lookup: {
                    from: "suppliers",
                    localField: "supplierId",
                    foreignField: "_id",
                    as: "supplier"
                }
            },
            { $unwind: "$supplier" },

            /* ---- unwind items ---- */
            { $unwind: "$items" },

            /* ---- product join ---- */
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },

            /* ---- extract correct variant ---- */
            {
                $addFields: {
                    variant: {
                        $first: {
                            $filter: {
                                input: "$product.variants",
                                as: "variant",
                                cond: {
                                    $eq: ["$$variant._id", "$items.variantId"]
                                }
                            }
                        }
                    }
                }
            },

            /* ---- group back to PO ---- */
            {
                $group: {
                    _id: "$_id",
                    status: { $first: "$status" },
                    createdAt: { $first: "$createdAt" },
                    supplier: {
                        $first: {
                            _id: "$supplier._id",
                            name: "$supplier.name"
                        }
                    },
                    items: {
                        $push: {
                            product: {
                                _id: "$product._id",
                                name: "$product.name"
                            },
                            variant: {
                                _id: "$variant._id",
                                sku: "$variant.sku",
                                attributes: "$variant.attributes"
                            },
                            orderedQty: "$items.orderedQty",
                            unitPrice: "$items.unitPrice",
                            lineTotal: {
                                $multiply: [
                                    "$items.orderedQty",
                                    "$items.unitPrice"
                                ]
                            }
                        }
                    }
                }
            },

            /* ---- derived fields ---- */
            {
                $addFields: {
                    itemCount: { $size: "$items" },
                    totalAmount: { $sum: "$items.lineTotal" }
                }
            },

            { $sort: { createdAt: -1 } }
        ];

        const data = await PurchaseOrder.aggregate(pipeline);

        return NextResponse.json({
            success: true,
            data
        });
    } catch (err) {
        return NextResponse.json(
            { error: err.message || "Failed to fetch purchase orders" },
            { status: err.status || 500 }
        );
    }
}
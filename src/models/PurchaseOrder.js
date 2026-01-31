import mongoose from "mongoose";

const PurchaseOrderItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        orderedQty: {
            type: Number,
            required: true,
            min: 1
        },
        receivedQty: {
            type: Number,
            default: 0,
            min: 0
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        }
    },
    { _id: false }
);

const PurchaseOrderSchema = new mongoose.Schema(
    {
        supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        status: {
            type: String,
            enum: ["DRAFT", "SENT", "CONFIRMED", "RECEIVED", "CANCELLED"],
            default: "DRAFT"
        },
        items: {
            type: [PurchaseOrderItemSchema],
            required: true
        }
    },
    {
        timestamps: true
    }
);

export function getPurchaseOrderModel(connection) {
    return (
        connection.models.PurchaseOrder ||
        connection.model("PurchaseOrder", PurchaseOrderSchema)
    );
}
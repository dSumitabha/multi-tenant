import mongoose from "mongoose";

const SalesOrderItemSchema = new mongoose.Schema(
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
        fulfilledQty: {
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

const SalesOrderSchema = new mongoose.Schema(
    {
        customerName: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["DRAFT", "CONFIRMED", "FULFILLED", "CANCELLED"],
            default: "DRAFT"
        },
        items: {
            type: [SalesOrderItemSchema],
            required: true
        }
    },
    {
        timestamps: true
    }
);

export function getSalesOrderModel(connection) {
    return (
        connection.models.SalesOrder ||
        connection.model("SalesOrder", SalesOrderSchema)
    );
}
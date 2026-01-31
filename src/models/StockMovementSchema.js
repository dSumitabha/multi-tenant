import mongoose from "mongoose";

const StockMovementSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        direction: {
            type: String,
            enum: ["IN", "OUT"],
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        reason: {
            type: String,
            enum: ["PURCHASE", "SALE", "RETURN", "ADJUSTMENT"],
            required: true
        },
        sourceType: {
            type: String,
            enum: ["PO", "SO", "MANUAL"],
            required: true
        },
        sourceId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
);

export default StockMovementSchema;
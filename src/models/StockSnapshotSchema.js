import mongoose from "mongoose";

const StockSnapshotSchema = new mongoose.Schema(
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
        availableQty: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        timestamps: { createdAt: false, updatedAt: true }
    }
);

StockSnapshotSchema.index(
    { productId: 1, variantId: 1 },
    { unique: true }
);

export default StockSnapshotSchema;
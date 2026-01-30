import mongoose from "mongoose";

const VariantSchema = new mongoose.Schema(
    {
        sku: { type: String, required: true },
        attributes: { type: Map, of: String },
        price: { type: Number, required: true },
        stock: { type: Number, default: 0 },
        reorderLevel: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true }
    },
    { _id: true }
);

const ProductSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        description: String,
        attributes: [
            {
                name: String,
                values: [String]
            }
        ],
        variants: [VariantSchema],
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

export function getProductModel(connection) {
    return (
        connection.models.Product ||
        connection.model("Product", ProductSchema)
    );
}
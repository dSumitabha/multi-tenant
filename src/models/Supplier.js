import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        contactEmail: {
            type: String,
            trim: true
        },
        contactPhone: {
            type: String,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

export function getSupplierModel(connection) {
    return (
        connection.models.Supplier ||
        connection.model("Supplier", SupplierSchema)
    );
}
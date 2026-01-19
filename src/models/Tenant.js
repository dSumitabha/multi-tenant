import mongoose from "mongoose";

const TenantSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        dbName: { type: String, required: true, unique: true },
        status: {
            type: String,
            enum: ["active", "suspended"],
            default: "active",
        },
    },
    { timestamps: true }
);

export function getTenantModel(conn) {
  return conn.models.Tenant || conn.model("Tenant", TenantSchema);
}
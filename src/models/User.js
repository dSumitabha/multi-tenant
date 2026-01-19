import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
        type: String,
        enum: ["owner", "manager", "staff"],
        required: true,
    },
    isActive: { type: Boolean, default: true },
    },
    { timestamps: true } 
);

export function getUserModel(conn) {
    return conn.models.User || conn.model("User", UserSchema);
}
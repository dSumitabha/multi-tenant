import mongoose from "mongoose";

let masterConnection = global.masterConnection || null;
global.masterConnection = masterConnection;

export async function getMasterConnection() {
    if (global.masterConnection) {
        return global.masterConnection;
    }

    const uri = `${process.env.MONGODB_BASE_URI}/${process.env.MASTER_DB_NAME}`;

    const conn = await mongoose.createConnection(uri, {
        bufferCommands: false,
    });

    global.masterConnection = conn;
    return conn;
}
import mongoose from "mongoose";

const connections = global.mongooseConnections || {};
global.mongooseConnections = connections;

export async function getTenantConnection(dbName) {
    if (!dbName) throw new Error("DB name missing");

    if (connections[dbName]) {
        return connections[dbName];
    }

    const uri = `${process.env.MONGODB_BASE_URI}/${dbName}`;

    const conn = await mongoose.createConnection(uri, {
        bufferCommands: false,
    });

    connections[dbName] = conn;
    return conn;
}
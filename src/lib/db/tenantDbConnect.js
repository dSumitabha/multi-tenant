import mongoose from "mongoose";

const connections = global.mongooseConnections || {};
global.mongooseConnections = connections;

export async function getTenantConnection(dbName) {
    if (!dbName) throw new Error("DB name missing");

    if (connections[dbName]) {
        const existing = connections[dbName];

        if (existing.readyState === 2) {
            await existing.asPromise();
        }

        return existing;
    }

    const uri = `${process.env.MONGODB_BASE_URI}/${dbName}`;

    const conn = mongoose.createConnection(uri, {
        bufferCommands: false,
    });

    await conn.asPromise();

    connections[dbName] = conn;
    return conn;
}
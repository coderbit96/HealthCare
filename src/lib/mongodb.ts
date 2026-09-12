import mongoose from "mongoose";

function normaliseMongoUri(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/^(?:"|')|(?:"|')$/g, "");
}

const MONGODB_URI = normaliseMongoUri(process.env.MONGODB_URI);

if (!MONGODB_URI) {
  console.warn("MONGODB_URI is not set. Database-backed routes will return a configuration error.");
}

type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalForMongoose = global as typeof globalThis & { mongoose?: MongooseCache };
const cached = globalForMongoose.mongoose ?? { conn: null, promise: null };
globalForMongoose.mongoose = cached;

export async function connectToDatabase() {
  if (!MONGODB_URI) throw new Error("Database is not configured");
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        connectTimeoutMS: 5_000,
        serverSelectionTimeoutMS: 5_000,
        maxPoolSize: 5,
      })
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}

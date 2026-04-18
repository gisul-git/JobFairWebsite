import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  migrationDone: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = globalThis._mongooseCache ?? {
  conn: null,
  promise: null,
  migrationDone: false,
};

globalThis._mongooseCache = cache;

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
      })
      .then((m) => m);
  }

  cache.conn = await cache.promise;

  if (!cache.migrationDone) {
    try {
      const users = cache.conn.connection.db?.collection("users");
      if (users) {
        const indexes = await users.indexes();
        const hasLegacyReferralIndex = indexes.some((idx) => idx.name === "referralCode_1");
        if (hasLegacyReferralIndex) {
          await users.dropIndex("referralCode_1");
        }
      }
    } catch {
      // Ignore index cleanup failures in runtime; app should still boot.
    } finally {
      cache.migrationDone = true;
    }
  }

  return cache.conn;
}

// Back-compat with earlier stubs in this repo
export const connectMongo = connectDB;


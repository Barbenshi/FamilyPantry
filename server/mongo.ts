import { MongoClient, Db, Collection, type Document } from "mongodb";
import "dotenv/config";

// The Mongo client should not be instantiated until the connection URI is
// available. In tests the `MONGO_URI` environment variable is set after this
// module is imported, so lazily create the client when `connect()` is called.
let client: MongoClient | null = null;

// Connect to MongoDB
export async function connect(uri: string = process.env.MONGO_URI as string): Promise<void> {
  try {
    if (!uri) {
      throw new Error("MONGO_URI not provided");
    }
    client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (err: any) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

// Get the database (optionally pass a name here if you don't want the default)
export function getDb(): Db {
  if (!client) {
    throw new Error("MongoClient not initialized. Call connect() first.");
  }
  return client.db("groceries_db");
}

// Generic helper to get a collection
export function getCollection<T extends Document>(name: string): Collection<T> {
  return getDb().collection<T>(name);
}

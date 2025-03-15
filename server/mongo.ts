import { MongoClient, Db, Collection } from "mongodb";
import 'dotenv/config'


const uri = process.env.MONGO_URI as string;
const client: MongoClient = new MongoClient(uri);

// Connect to MongoDB
export async function connect(): Promise<void> {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (err: any) {
    console.error("MongoDB connection error:", err);
  }
}

// Get the database (optionally pass a name here if you don't want the default)
export function getDb(): Db {
  return client.db('groceries_db');
}

// Generic helper to get a collection
export function getCollection<T>(name: string): Collection<T> {
  return getDb().collection<T>(name);
}

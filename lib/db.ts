import { MongoClient, type Collection } from "mongodb";
import type { SaleEntry } from "@/lib/types";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
// MongoDB creates the database and collection automatically on first insert
const dbName = "sales_tracker";
const collectionName = "sales";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

function getClient(): MongoClient {
  if (globalThis._mongoClient) {
    return globalThis._mongoClient;
  }
  globalThis._mongoClient = new MongoClient(uri);
  return globalThis._mongoClient;
}

export async function getSalesCollection(): Promise<Collection<SaleEntry>> {
  const client = getClient();
  await client.connect();
  return client.db(dbName).collection<SaleEntry>(collectionName);
}

import { MongoClient, Db } from "mongodb";

declare global {
  var _mongoClient: MongoClient | undefined;
  var _mongoDb: Db | undefined;
}

let client: MongoClient;
let db: Db;

function getClient(): MongoClient {
  if (client) return client;
  const uri = process.env.MONGODB_URI!;
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClient) {
      global._mongoClient = new MongoClient(uri);
    }
    client = global._mongoClient;
  } else {
    client = new MongoClient(uri);
  }
  return client;
}

export async function getDb(): Promise<Db> {
  if (db) return db;
  const c = getClient();
  await c.connect();
  db = c.db(process.env.MONGODB_DB || "ninebound");

  await db.collection("users").createIndex({ uid: 1 }, { unique: true });
  await db.collection("users").createIndex({ qqHash: 1 }, { unique: true });
  await db.collection("pending_rewards").createIndex({ uid: 1 });

  return db;
}

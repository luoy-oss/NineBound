import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB || "ninebound";

declare global {
  var _mongoClient: MongoClient | undefined;
  var _mongoDb: Db | undefined;
}

let client: MongoClient;
let db: Db;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri);
  }
  client = global._mongoClient;
} else {
  client = new MongoClient(uri);
}

export async function getDb(): Promise<Db> {
  if (db) return db;
  await client.connect();
  db = client.db(dbName);

  // 确保索引存在
  await db.collection("users").createIndex({ uid: 1 }, { unique: true });
  await db.collection("users").createIndex({ qqHash: 1 }, { unique: true });
  await db.collection("pending_rewards").createIndex({ uid: 1 });

  return db;
}

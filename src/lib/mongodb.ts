import { MongoClient, Db, ServerApiVersion } from "mongodb";

declare global {
  var _mongoClient: MongoClient | undefined;
}

let db: Db;

function getClient(): MongoClient {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClient) {
      global._mongoClient = new MongoClient(process.env.MONGODB_URI!, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
      });
    }
    return global._mongoClient;
  }
  return new MongoClient(process.env.MONGODB_URI!, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
}

export async function getDb(): Promise<Db> {
  if (db) return db;
  const client = getClient();
  await client.connect();
  db = client.db(process.env.MONGODB_DB || "ninebound");

  await db.collection("users").createIndex({ uid: 1 }, { unique: true });
  await db.collection("users").createIndex({ qqHash: 1 }, { unique: true });
  await db.collection("pending_rewards").createIndex({ uid: 1 });

  return db;
}

// MongoDB索引初始化脚本
// 运行: node scripts/setup-db.js
require("dotenv").config({ path: ".env.local" });
const { MongoClient } = require("mongodb");

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB);

  // users集合索引
  await db.collection("users").createIndex({ uid: 1 }, { unique: true });
  await db.collection("users").createIndex({ qqHash: 1 }, { unique: true });

  // pending_rewards集合索引
  await db.collection("pending_rewards").createIndex({ uid: 1 });
  await db.collection("pending_rewards").createIndex({ token: 1 }, { sparse: true });

  console.log("索引创建完成");
  await client.close();
}

main().catch(console.error);

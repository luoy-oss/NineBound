require("dotenv").config({ path: ".env.local" });
const { MongoClient } = require("mongodb");

async function main() {
  console.log("正在连接 MongoDB Atlas...");
  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const collections = await db.listCollections().toArray();
    console.log("连接成功! 数据库:", process.env.MONGODB_DB);
    console.log("现有集合:", collections.map(c => c.name).join(", ") || "(空)");
  } catch (err) {
    console.error("连接失败:", err.message);
  } finally {
    await client.close();
  }
}
main();

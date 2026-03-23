/**
 * Database Index Migration Script
 *
 * Ensures all indexes defined in Mongoose schemas are created in MongoDB.
 * Safe to run multiple times — createIndexes() is idempotent.
 *
 * Usage: npx ts-node scripts/create-indexes.ts
 * Requires MONGODB_URI env var.
 */

import mongoose from "mongoose";

async function createIndexes() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Error: MONGODB_URI environment variable is required");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected.");

  // Import all models to register schemas
  const models = [
    "content-analysis",
    "keyword-analysis",
    "user-analysis-records",
    "account-analysis",
    "user",
    "douyin-hotlist",
    "xiaohongshu-hotlist",
  ];

  for (const model of models) {
    try {
      await import(`../packages/database/src/models/${model}`);
    } catch (err) {
      console.warn(`Warning: Could not import model ${model}:`, err);
    }
  }

  // Create indexes for all registered models
  const registeredModels = Object.keys(mongoose.models);
  console.log(`\nCreating indexes for ${registeredModels.length} models...\n`);

  for (const modelName of registeredModels) {
    try {
      const model = mongoose.models[modelName];
      await model.createIndexes();
      const indexes = await model.collection.indexes();
      console.log(
        `✅ ${modelName}: ${indexes.length} indexes (including _id)`,
      );
      for (const idx of indexes) {
        if (idx.name !== "_id_") {
          console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
        }
      }
    } catch (err) {
      console.error(`❌ ${modelName}: failed —`, err);
    }
  }

  console.log("\nDone.");
  await mongoose.disconnect();
}

createIndexes().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

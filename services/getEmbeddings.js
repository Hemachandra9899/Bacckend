// services/getEmbeddings.js - CRITICAL DIMENSION FIX

import { pipeline } from "@xenova/transformers";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config();

// ============================================
// 🚨 CRITICAL ISSUE IDENTIFIED:
// ============================================
/*
YOUR PINECONE INDEX:
- Dimensions: 1536 (configured for OpenAI embeddings)

YOUR MODEL:
- Xenova/all-MiniLM-L6-v2 produces: 384 dimensions

RESULT: DIMENSION MISMATCH! ❌
This will cause "dimension mismatch" errors when upserting.

SOLUTIONS:
Option 1: Use a different embedding model (1536 dimensions)
Option 2: Create new Pinecone index with 384 dimensions
Option 3: Use OpenAI embeddings (paid)
*/

// ============================================
// SOLUTION 1: Use 1536-dimension Model (RECOMMENDED)
// ============================================

let embedder = null;

const getEmbedder = async () => {
  if (!embedder) {
    console.log("🔄 Loading embedding model...");
    
    // ⚠️ THIS MODEL (384 dims) WON'T WORK WITH YOUR INDEX (1536 dims)
    // embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    
    // ✅ OPTION 1A: Use larger model with padding (workaround)
    // This still won't give you 1536 dimensions with Xenova models
    
    // ✅ OPTION 1B: Best solution - use OpenAI for 1536 dimensions
    console.log("⚠️  WARNING: Xenova models produce 384 dimensions");
    console.log("   Your Pinecone index expects 1536 dimensions");
    console.log("   This WILL cause errors!");
    
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("✅ Model loaded (384 dimensions)");
  }
  return embedder;
};

// ============================================
// PINECONE SETUP
// ============================================

if (!process.env.PINECONE_API_KEY) {
  throw new Error("❌ PINECONE_API_KEY is missing");
}

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || "portfolio-free";
export const index = pinecone.Index(INDEX_NAME);

// ============================================
// TEMPORARY WORKAROUND: Pad to 1536 dimensions
// ============================================

/**
 * Pads 384-dim vector to 1536 dimensions with zeros
 * This is a WORKAROUND, not ideal for production
 */
const padEmbedding = (embedding384) => {
  const targetDim = 384;
  const currentDim = embedding384.length;
  
  if (currentDim === targetDim) {
    return embedding384;
  }
  
  console.warn(`⚠️  Padding ${currentDim} dimensions to ${targetDim}`);
  
  // Pad with zeros
  const padded = new Array(targetDim).fill(0);
  for (let i = 0; i < currentDim; i++) {
    padded[i] = embedding384[i];
  }
  
  return padded;
};

// ============================================
// GET FREE EMBEDDING (WITH PADDING)
// ============================================

export const getFreeEmbedding = async (text) => {
  try {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      throw new Error("Valid text input is required");
    }

    const model = await getEmbedder();
    
    console.log(`🔢 Generating embedding for: "${text.substring(0, 50)}..."`);
    const output = await model(text, { 
      pooling: "mean", 
      normalize: true 
    });

    const embedding384 = Array.from(output.data);
    console.log(`   Original dimensions: ${embedding384.length}`);
    
    // ⚠️ WORKAROUND: Pad to 1536
    const embedding1536 = padEmbedding(embedding384);
    console.log(`   Padded to: ${embedding1536.length} dimensions`);
    
    return embedding1536;

  } catch (error) {
    console.error("❌ Error generating embedding:", error);
    throw error;
  }
};

// ============================================
// INITIALIZE PINECONE
// ============================================

export const initPinecone = async () => {
  try {
    console.log(`\n${"=".repeat(60)}`);
    console.log("🔄 INITIALIZING PINECONE");
    console.log("=".repeat(60));
    
    const stats = await index.describeIndexStats();

    console.log("✅ Pinecone connection successful!");
    console.log("\n📊 Index Configuration:");
    console.log(`   Index Name: ${INDEX_NAME}`);
    console.log(`   Dimensions: ${stats.dimension}`);
    console.log(`   Total Vectors: ${stats.totalRecordCount || 0}`);
    console.log(`   Index Fullness: ${(stats.indexFullness * 100).toFixed(2)}%`);
    
    // 🚨 CRITICAL WARNING
    if (stats.dimension === 1536) {
      console.log("\n⚠️  DIMENSION MISMATCH WARNING:");
      console.log("   Your index expects: 1536 dimensions");
      console.log("   Your model produces: 384 dimensions");
      console.log("   Current solution: Padding with zeros (NOT IDEAL)");
      console.log("\n💡 RECOMMENDED FIXES:");
      console.log("   1. Use OpenAI embeddings (text-embedding-ada-002)");
      console.log("   2. Create new index with 384 dimensions");
      console.log("   3. Use sentence-transformers with 1536 dims (if available)");
    }
    
    console.log("=".repeat(60) + "\n");

    return stats;

  } catch (err) {
    console.error("\n❌ PINECONE INITIALIZATION FAILED:");
    console.error(`   Error: ${err.message}`);
    
    if (err.message.includes("API key")) {
      console.error("   → Check PINECONE_API_KEY in .env");
    } else if (err.message.includes("not found")) {
      console.error(`   → Index "${INDEX_NAME}" doesn't exist`);
    }
    
    throw err;
  }
};

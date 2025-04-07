// pages/api/test-pinecone.js
import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

dotenv.config();

export default async function handler(req, res) {
  try {
    console.log("==================== TEST PINECONE ====================");
    console.log("Mulai tes Pinecone...");
    console.log("PINECONE_API_KEY tersedia:", !!process.env.PINECONE_API_KEY);
    console.log("PINECONE_INDEX_NAME:", process.env.PINECONE_INDEX_NAME);
    
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    
    console.log("Pinecone client berhasil dibuat");
    
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);
    console.log("Index berhasil diakses");
    
    // Statistik index
    try {
      const stats = await index.describeIndexStats();
      console.log("Index stats:", JSON.stringify(stats, null, 2));
    } catch (statsError) {
      console.error("Error getting index stats:", statsError);
    }
    
    // Buat vector dummy dengan 1024 dimensi
    const vector = new Array(1024).fill(0.1);
    console.log("Vector dummy dibuat dengan dimensi:", vector.length);
    
    // Upsert vector
    console.log("Mengirim vector uji ke Pinecone...");
    const testId = `test-vector-${Date.now()}`;
    console.log("Test vector ID:", testId);
    
    const upsertResponse = await index.upsert([{
      id: testId,
      values: vector,
      metadata: { 
        test: true,
        source: "api-test",
        timestamp: new Date().toISOString()
      }
    }]);
    
    console.log("Upsert response:", JSON.stringify(upsertResponse));
    
    // Coba query vector yang baru saja dimasukkan
    console.log("Mencoba query vector yang baru dimasukkan...");
    try {
      const queryResponse = await index.query({
        vector: vector,
        topK: 1,
        includeMetadata: true
      });
      
      console.log("Query response:", JSON.stringify(queryResponse));
    } catch (queryError) {
      console.error("Error saat query:", queryError);
    }
    
    console.log("======================================================");
    
    res.status(200).json({ 
      success: true, 
      response: upsertResponse,
      message: "Lihat log server untuk informasi detail"
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.toString() });
  }
}
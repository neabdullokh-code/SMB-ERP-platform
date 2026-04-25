require('dotenv').config();
const { Worker } = require('bullmq');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// This worker processes waybills uploaded via the SMB Surface
const ocrWorker = new Worker('ocr-queue', async (job) => {
  const { jobId, tenantId, fileUrl } = job.data;
  
  console.log(`[OCR] Starting job ${jobId} for tenant ${tenantId}`);

  // 1. Simulate AI Latency (Claude OCR processing)
  await new Promise(r => setTimeout(r, 5000));

  // 2. Mock Extracted Data
  const extractedData = {
    supplier: "Samarkand Oil Co.",
    documentNo: "WB-23887",
    items: [
      { sku: "KS-0102", name: "Cooking oil, sunflower 5L", qty: 120, price: 48000 },
      { sku: "KS-0104", name: "Sugar refined 50kg bag", qty: 40, price: 310000 }
    ],
    total: 45707200
  };

  // 3. Store result in DB or a cache for the client to retrieve
  // In a real app, D5 would trigger a WebSocket push here
  console.log(`[OCR] Job ${jobId} complete. Ready for frontend verification.`);
  
  return extractedData;
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

ocrWorker.on('completed', (job) => {
  // Trigger D5 WebSocket layer here:
  // io.to(job.data.tenantId).emit('ocr_complete', { jobId: job.data.jobId, result: job.returnvalue });
});

module.exports = ocrWorker;
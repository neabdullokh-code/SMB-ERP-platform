const express = require('express');
const router = express.Router();
const { Queue } = require('bullmq');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

const ocrQueue = new Queue('ocr-queue', { connection });

// --- Inventory & OCR ---

router.post('/inventory/scan', async (req, res) => {
  const { fileUrl } = req.body;
  const jobId = `ocr_${Date.now()}`;
  
  // Offload to BullMQ immediately
  await ocrQueue.add('process-waybill', {
    jobId,
    tenantId: req.user.tenantId, // From D1 Auth Middleware
    fileUrl
  }, { 
    jobId,
    removeOnComplete: { count: 100 }, // Keep last 100 jobs for verification
    removeOnFail: { count: 500 }
  }); 

  res.status(202).json({ jobId, status: 'processing' });
});

// New: Endpoint to check OCR job status manually (Verification Tool)
router.get('/inventory/scan/:jobId', async (req, res) => {
  const job = await ocrQueue.getJob(req.params.jobId);
  
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const state = await job.getState();
  const result = job.returnvalue;
  res.json({ id: job.id, state, result });
});

router.get('/inventory', async (req, res) => {
  const products = await prisma.product.findMany({
    where: { tenantId: req.user.tenantId },
    include: { movements: { take: 5, orderBy: { createdAt: 'desc' } } }
  });
  res.json(products);
});

// --- Production & BOM ---

router.post('/production/orders', async (req, res) => {
  const { bomId, plannedQty } = req.body;
  
  const order = await prisma.productionOrder.create({
    data: {
      tenantId: req.user.tenantId,
      bomId,
      plannedQty,
      status: 'SCHEDULED'
    }
  });
  
  res.json(order);
});

// --- Services Kanban ---

router.patch('/work-orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // e.g., "IN_PROGRESS"

  const updated = await prisma.workOrder.update({
    where: { 
      id,
      tenantId: req.user.tenantId 
    },
    data: { status }
  });

  res.json(updated);
});

module.exports = router;
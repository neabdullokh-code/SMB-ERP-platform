require('dotenv').config();
const express = require('express');
const smbOpsRouter = require('./smb-ops');

const app = express();
app.use(express.json());

// Mock D1 Auth Middleware
app.use((req, res, next) => {
  req.user = {
    id: 'user_01',
    tenantId: 'tenant_kamolot_01',
    role: 'OWNER'
  };
  next();
});

// Health check for monitoring DB and system status
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount D2 Operations
app.use('/api/smb', smbOpsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`
🚀 SMB Operations Test Server running at http://localhost:${PORT}

Check points:
GET  /api/smb/inventory        -> Fetch products & movements
POST /api/smb/inventory/scan   -> Queue an OCR job (requires Redis)
  `);
});
// -----------------------------------------------------------------------------
// Document + Ledger types (1C Document/Accumulation-Register pattern)
// -----------------------------------------------------------------------------

export type DocumentStatus = "DRAFT" | "POSTED" | "VOID";

export type InventoryMovementType = "IN" | "OUT";

export type InventoryDocumentKind =
  | "goods_receipt"
  | "goods_issue"
  | "inventory_transfer"
  | "production_consumption"
  | "production_output"
  | "stocktake_adjustment"
  | "legacy_backfill";

// -----------------------------------------------------------------------------
// Goods Receipt
// -----------------------------------------------------------------------------

export interface GoodsReceiptLine {
  id: string;
  headerId: string;
  tenantId: string;
  position: number;
  itemId: string;
  quantity: string;
  unitCostUzs: string;
  lineTotalUzs: string;
  notes?: string;
}

export interface GoodsReceiptHeader {
  id: string;
  tenantId: string;
  documentNumber: string;
  documentDate: string;
  warehouseId: string;
  counterpartyId?: string;
  status: DocumentStatus;
  notes?: string;
  postedAt?: string;
  voidedAt?: string;
  createdAt: string;
  updatedAt: string;
  lines: GoodsReceiptLine[];
}

export interface GoodsReceiptLineInput {
  itemId: string;
  quantity: string;
  unitCostUzs: string;
  notes?: string;
}

export interface CreateGoodsReceiptRequest {
  documentNumber?: string;
  documentDate: string;
  warehouseId: string;
  counterpartyId?: string;
  notes?: string;
  lines: GoodsReceiptLineInput[];
}

// -----------------------------------------------------------------------------
// Goods Issue
// -----------------------------------------------------------------------------

export interface GoodsIssueLine {
  id: string;
  headerId: string;
  tenantId: string;
  position: number;
  itemId: string;
  quantity: string;
  notes?: string;
}

export interface GoodsIssueHeader {
  id: string;
  tenantId: string;
  documentNumber: string;
  documentDate: string;
  warehouseId: string;
  counterpartyId?: string;
  status: DocumentStatus;
  notes?: string;
  postedAt?: string;
  voidedAt?: string;
  createdAt: string;
  updatedAt: string;
  lines: GoodsIssueLine[];
}

export interface GoodsIssueLineInput {
  itemId: string;
  quantity: string;
  notes?: string;
}

export interface CreateGoodsIssueRequest {
  documentNumber?: string;
  documentDate: string;
  warehouseId: string;
  counterpartyId?: string;
  notes?: string;
  lines: GoodsIssueLineInput[];
}

// -----------------------------------------------------------------------------
// Inventory Transfer
// -----------------------------------------------------------------------------

export interface InventoryTransferLine {
  id: string;
  headerId: string;
  tenantId: string;
  position: number;
  itemId: string;
  quantity: string;
  notes?: string;
}

export interface InventoryTransferHeader {
  id: string;
  tenantId: string;
  documentNumber: string;
  documentDate: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  status: DocumentStatus;
  notes?: string;
  postedAt?: string;
  voidedAt?: string;
  createdAt: string;
  updatedAt: string;
  lines: InventoryTransferLine[];
}

export interface CreateInventoryTransferRequest {
  documentNumber?: string;
  documentDate: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  notes?: string;
  lines: Array<{ itemId: string; quantity: string; notes?: string }>;
}

// -----------------------------------------------------------------------------
// Production Order Document
// -----------------------------------------------------------------------------

export interface ProductionOrderDocument {
  id: string;
  tenantId: string;
  documentNumber: string;
  documentDate: string;
  bomId: string;
  warehouseId: string;
  plannedUnits: string;
  producedUnits: string;
  outputItemId: string;
  status: DocumentStatus;
  notes?: string;
  scheduledDate?: string;
  postedAt?: string;
  voidedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductionOrderDocumentRequest {
  documentNumber?: string;
  documentDate: string;
  bomId: string;
  warehouseId: string;
  plannedUnits: string;
  outputItemId: string;
  producedUnits?: string;
  scheduledDate?: string;
  notes?: string;
}

// -----------------------------------------------------------------------------
// Ledger read rows
// -----------------------------------------------------------------------------

export interface InventoryLedgerEntry {
  id: string;
  tenantId: string;
  periodAt: string;
  documentKind: InventoryDocumentKind;
  documentId: string;
  warehouseId: string;
  itemId: string;
  movementType: InventoryMovementType;
  quantity: string;
  unitCostUzs: string;
  costUzs: string;
  createdAt: string;
}

export interface InventoryOnHand {
  tenantId: string;
  warehouseId: string;
  itemId: string;
  onHand: string;
  wacUnitCostUzs: string;
}

// -----------------------------------------------------------------------------
// Posting error payload (mirrors DocumentPostingError.details)
// -----------------------------------------------------------------------------

export interface InsufficientStockDetail {
  itemId: string;
  itemName?: string;
  itemSku?: string;
  warehouseId: string;
  available: string;
  requested: string;
}

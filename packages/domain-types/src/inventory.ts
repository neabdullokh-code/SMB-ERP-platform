export interface Warehouse {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  location: string;
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  category: string;
  onHand: number;
  reorderPoint: number;
  valuationUzs: number;
  warehouseId: string;
}

export interface InventoryMovement {
  id: string;
  tenantId: string;
  itemId: string;
  movementType: "inbound" | "outbound" | "transfer" | "adjustment";
  quantity: number;
  occurredAt: string;
  reference: string;
}

export interface Stocktake {
  id: string;
  tenantId: string;
  warehouseId: string;
  startedAt: string;
  completedAt?: string;
  varianceCount: number;
}


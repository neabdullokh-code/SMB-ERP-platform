export interface BOM {
  id: string;
  tenantId: string;
  code: string;
  outputSku: string;
  version: string;
  materials: Array<{ sku: string; quantity: number; unit: string }>;
}

export interface ProductionOrder {
  id: string;
  tenantId: string;
  bomId: string;
  status: "planned" | "in_progress" | "completed" | "blocked";
  plannedUnits: number;
  producedUnits: number;
  scheduledDate: string;
}

export interface ScrapRecord {
  id: string;
  tenantId: string;
  productionOrderId: string;
  reason: string;
  quantity: number;
  recordedAt: string;
}


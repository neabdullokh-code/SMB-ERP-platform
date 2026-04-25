import { z } from "zod";
import { parseOrThrow } from "../finance/validation.js";

export const CreateWarehouseSchema = z.object({
  code: z.string().min(1, "Warehouse code is required.").max(20, "Warehouse code must be at most 20 characters."),
  name: z.string().min(1, "Warehouse name is required."),
  location: z.string().min(1, "Warehouse location is required.")
});

export const CreateInventoryItemSchema = z.object({
  warehouseId: z.string().uuid("Warehouse ID must be a valid UUID."),
  sku: z.string().min(1, "SKU is required."),
  name: z.string().min(1, "Item name is required."),
  category: z.string().min(1, "Category is required."),
  reorderPoint: z.number().int().nonnegative("Reorder point must be a non-negative integer.").optional().default(0),
  unitCostUzs: z
    .string()
    .refine((v) => { try { return Number(v) >= 0; } catch { return false; } }, { message: "Unit cost must be a non-negative decimal string." })
    .optional()
});

export const UpdateInventoryItemSchema = z.object({
  warehouseId: z.string().uuid("Warehouse ID must be a valid UUID.").optional(),
  sku: z.string().min(1, "SKU is required.").optional(),
  name: z.string().min(1, "Item name is required.").optional(),
  category: z.string().min(1, "Category is required.").optional(),
  reorderPoint: z.number().int().nonnegative("Reorder point must be a non-negative integer.").optional(),
  unitCostUzs: z
    .string()
    .refine((v) => { try { return Number(v) >= 0; } catch { return false; } }, { message: "Unit cost must be a non-negative decimal string." })
    .optional()
});

export const RecordMovementSchema = z.object({
  itemId: z.string().uuid("Item ID must be a valid UUID."),
  movementType: z.enum(["inbound", "outbound", "transfer", "adjustment"]),
  quantity: z
    .string()
    .refine((v) => { try { return Number(v) > 0; } catch { return false; } }, { message: "Quantity must be a positive decimal string." }),
  reference: z.string().min(1, "Reference is required.")
});

export const CompleteStocktakeSchema = z.object({
  varianceCount: z.number().int().nonnegative("Variance count must be a non-negative integer.")
});

export { parseOrThrow };

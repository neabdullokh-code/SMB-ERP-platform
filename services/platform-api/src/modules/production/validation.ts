import { z } from "zod";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const isoDate = z.string().regex(isoDateRegex, "Date must use YYYY-MM-DD format.");

const materialSchema = z.object({
  sku: z.string().min(1, "Material SKU is required."),
  quantity: z.number().positive("Material quantity must be positive."),
  unit: z.string().min(1, "Material unit is required.")
});

export const CreateBOMSchema = z.object({
  code: z.string().min(1, "BOM code is required."),
  outputSku: z.string().min(1, "Output SKU is required."),
  version: z.string().min(1, "Version is required."),
  materials: z.array(materialSchema).min(1, "At least one material is required.")
});

export const UpdateBOMSchema = z.object({
  code: z.string().min(1, "BOM code is required.").optional(),
  outputSku: z.string().min(1, "Output SKU is required.").optional(),
  version: z.string().min(1, "Version is required.").optional(),
  materials: z.array(materialSchema).min(1, "At least one material is required.").optional()
});

export const CreateProductionOrderSchema = z.object({
  bomId: z.string().uuid("BOM ID must be a valid UUID."),
  plannedUnits: z.number().int().positive("Planned units must be a positive integer."),
  scheduledDate: isoDate
});

export const UpdateProductionOrderStatusSchema = z.object({
  status: z.enum(["planned", "in_progress", "completed", "blocked"], {
    errorMap: () => ({ message: "Status must be one of: planned, in_progress, completed, blocked." })
  }),
  producedUnits: z.number().int().min(0, "Produced units must be non-negative.").optional()
});

export const CreateScrapRecordSchema = z.object({
  productionOrderId: z.string().uuid("Production order ID must be a valid UUID."),
  reason: z.string().min(1, "Reason is required."),
  quantity: z.number().positive("Quantity must be positive.")
});

export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  const firstIssue = result.error.issues[0];
  const path = firstIssue.path.length > 0 ? `${firstIssue.path.join(".")}: ` : "";
  const error = new Error(`${path}${firstIssue.message}`);
  (error as Error & { statusCode: number }).statusCode = 400;
  throw error;
}

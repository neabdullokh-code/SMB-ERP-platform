import { z } from "zod";
import { parseOrThrow } from "../finance/validation.js";

export const CreditDecisionSchema = z.object({
  decision: z.enum(["approve", "counter_offer", "decline"]),
  approvedAmount: z.string().optional(),
  approvedTermMonths: z.number().int().positive().optional(),
  approvedRatePercent: z.string().optional(),
  notes: z.string().max(4000).optional()
});

export const CreditAssignSchema = z.object({
  assignedBankUserId: z.string().uuid("Assigned bank user must be a valid UUID.")
});

export { parseOrThrow };

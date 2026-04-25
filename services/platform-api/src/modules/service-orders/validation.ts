import { z } from "zod";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const isoDate = z.string().regex(isoDateRegex, "Date must use YYYY-MM-DD format.");

export const CreateServiceOrderSchema = z.object({
  title: z.string().min(1, "Title is required."),
  customer: z.string().min(1, "Customer is required."),
  requestedBy: z.string().min(1, "Requested by is required."),
  dueDate: isoDate
});

export const UpdateServiceOrderStatusSchema = z.object({
  status: z.enum(["submitted", "approved", "in_progress", "completed", "rejected"], {
    errorMap: () => ({ message: "Status must be one of: submitted, approved, in_progress, completed, rejected." })
  })
});

export const ProcessApprovalSchema = z.object({
  status: z.enum(["approved", "rejected"], {
    errorMap: () => ({ message: "Approval status must be either approved or rejected." })
  })
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

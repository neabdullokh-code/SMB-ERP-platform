export interface ServiceOrder {
  id: string;
  tenantId: string;
  title: string;
  customer: string;
  status: "submitted" | "approved" | "in_progress" | "completed" | "rejected";
  requestedBy: string;
  dueDate: string;
}

export interface ApprovalRequest {
  id: string;
  tenantId: string;
  entityType: "service_order" | "transfer" | "stock_adjustment";
  entityId: string;
  submittedBy: string;
  approverRole: "company_admin" | "bank_admin";
  status: "pending" | "approved" | "rejected";
}


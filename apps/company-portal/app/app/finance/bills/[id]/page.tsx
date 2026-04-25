import { BillDetailPage } from "@/features/finance";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BillDetailPage billId={id} />;
}

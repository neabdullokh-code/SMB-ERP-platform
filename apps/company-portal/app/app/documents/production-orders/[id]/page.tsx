import { ProductionOrderDetailPage } from "@/features/documents";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductionOrderDetailPage documentId={id} />;
}

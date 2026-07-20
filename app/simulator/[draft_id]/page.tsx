import { SimulatorDraftPage } from "@/components/draft/SimulatorDraftPage";

export default async function Page({
  params,
}: {
  params: Promise<{ draft_id: string }>;
}) {
  const { draft_id } = await params;
  return <SimulatorDraftPage simId={draft_id} />;
}
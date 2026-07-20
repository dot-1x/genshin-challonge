import { TournamentDraftPage } from "@/components/draft/TournamentDraftPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; d_id: string }>;
}) {
  const { id, d_id } = await params;
  return <TournamentDraftPage tournamentId={id} matchId={d_id} />;
}
import { TournamentView } from "@/components/TournamentView";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TournamentView id={id} />;
}

"use client";

import Link from "next/link";
import { useTournament } from "@/lib/store";
import { useRoster } from "@/lib/roster";
import { DraftView } from "@/components/draft/DraftView";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";

export function TournamentDraftPage({
  tournamentId,
  matchId,
}: {
  tournamentId: string;
  matchId: string;
}) {
  const { tournament, loaded, setDraft, submitResult } =
    useTournament(tournamentId);
  const {
    rosterMap,
    loading: rosterLoading,
    error: rosterError,
    refresh,
  } = useRoster();

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!tournament) {
    return (
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 space-y-4">
        <p className="text-lg font-medium">Tournament not found.</p>
        <Button render={<Link href="/" />}>Back to Home</Button>
      </main>
    );
  }

  const match = tournament.matches.find((m) => m.id === matchId) ?? null;

  if (!match) {
    return (
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 space-y-4">
        <Button
          render={<Link href={`/t/${tournamentId}`} />}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="size-4" />
          Back to tournament
        </Button>
        <p className="text-lg font-medium">Match not found.</p>
      </main>
    );
  }

  if (rosterLoading && rosterMap.size === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading roster from Yatta API...
      </div>
    );
  }

  if (rosterError && rosterMap.size === 0) {
    return (
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 flex flex-col items-center gap-3">
        <p className="text-sm text-destructive">
          Failed to load roster: {rosterError}
        </p>
        <Button variant="outline" onClick={refresh}>
          <RefreshCw className="size-4" />
          Retry
        </Button>
      </main>
    );
  }

  return (
    <DraftView
      match={match}
      tournament={tournament}
      rosterMap={rosterMap}
      onSetDraft={(draft) => setDraft(match.id, draft)}
      onSubmitResult={(winnerId) => submitResult(match.id, winnerId)}
      backHref={`/t/${tournamentId}`}
    />
  );
}
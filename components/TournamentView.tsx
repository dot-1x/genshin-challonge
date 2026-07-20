"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTournament } from "@/lib/store";
import { useRoster } from "@/lib/roster";
import { BracketView } from "@/components/BracketView";
import { RegistrationModal } from "@/components/RegistrationModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, RefreshCw } from "lucide-react";
import type { BracketType, TournamentType } from "@/lib/types";

function formatLabel(f: BracketType): string {
  return f === "double" ? "Double Elim" : "Single Elim";
}

function typeLabel(t: TournamentType): string {
  if (t === "spiral") return "Spiral Abyss";
  return "Stygian";
}

export function TournamentView({ id }: { id: string }) {
  const {
    tournament,
    loaded,
    setRegistration,
  } = useTournament(id);
  const {
    roster,
    loading: rosterLoading,
    error: rosterError,
    refresh,
  } = useRoster();
  const router = useRouter();
  const [regPlayerId, setRegPlayerId] = useState<string | null>(null);

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!tournament) {
    return (
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        <p className="text-lg font-medium mb-4">Tournament not found.</p>
        <Button render={<Link href="/" />}>Back to Home</Button>
      </main>
    );
  }

  const regPlayer = regPlayerId
    ? tournament.players.find((p) => p.id === regPlayerId) ?? null
    : null;
  const champion = tournament.championId
    ? tournament.players.find((p) => p.id === tournament.championId)
    : null;

  function handleOpenDraft(matchId: string) {
    router.push(`/t/${id}/draft/${matchId}`);
  }

  return (
    <main className="flex-1 w-full flex flex-col">
      <header className="border-b px-4 py-3 sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button render={<Link href="/" />} variant="ghost" size="icon-sm" className="shrink-0">
              <ArrowLeft className="size-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">{tournament.name}</h1>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="secondary">
                  {formatLabel(tournament.format)}
                </Badge>
                <Badge variant="secondary">
                  {typeLabel(tournament.type)}
                </Badge>
                <Badge variant="secondary">
                  {tournament.playerCount} players
                </Badge>
                <Badge variant="secondary">
                  Max cost {tournament.costConfig.maxCost}
                </Badge>
                {tournament.status === "complete" && champion && (
                  <Badge>
                    <Trophy className="size-3" />
                    {champion.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {rosterLoading && !roster && (
              <span className="text-sm text-muted-foreground">
                Loading roster...
              </span>
            )}
            {rosterError && (
              <Button variant="outline" size="sm" onClick={refresh}>
                <RefreshCw className="size-3" />
                Retry roster
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        {rosterLoading && !roster ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading roster from Yatta API...
          </div>
        ) : rosterError && !roster ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <p className="text-sm text-destructive">
              Failed to load roster: {rosterError}
            </p>
            <Button variant="outline" onClick={refresh}>
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </div>
        ) : (
          <BracketView
            tournament={tournament}
            onOpenDraft={handleOpenDraft}
            onOpenRegistration={(playerId) => setRegPlayerId(playerId)}
          />
        )}
      </div>

      {regPlayer && roster && (
        <RegistrationModal
          player={regPlayer}
          roster={roster}
          onSave={(reg) => setRegistration(regPlayer.id, reg)}
          onOpenChange={(open) => !open && setRegPlayerId(null)}
        />
      )}
    </main>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSimulations } from "@/lib/simulator";
import { useRoster } from "@/lib/roster";
import { DraftView } from "@/components/draft/DraftView";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { makeMatch, makeTournament } from "@/components/simulator/utils";

export function SimulatorDraftPage({ simId }: { simId: string }) {
  const { list, update } = useSimulations();
  const {
    rosterMap,
    loading: rosterLoading,
    error: rosterError,
    refresh,
  } = useRoster();
  const router = useRouter();

  const sim = simId ? list.find((s) => s.id === simId) ?? null : null;
  const needsRedirect = !!sim && (
    sim.playerARegistration.length === 0 ||
    sim.playerBRegistration.length === 0
  );

  useEffect(() => {
    if (list.length > 0 && !sim) {
      router.replace("/simulator");
    } else if (needsRedirect) {
      router.replace("/simulator");
    }
  }, [list, sim, needsRedirect, router]);

  if (!sim) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (needsRedirect) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Redirecting...
      </div>
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

  const tournament = makeTournament(sim);
  const match = makeMatch(sim.draft);

  return (
    <DraftView
      match={match}
      tournament={tournament}
      rosterMap={rosterMap}
      onSetDraft={(draft) => update(sim.id, { ...sim, draft })}
      onSubmitResult={(winnerId) => {
        if (!sim.draft) return;
        update(sim.id, {
          ...sim,
          draft: { ...sim.draft, winnerId },
        });
      }}
      backHref="/simulator"
    />
  );
}
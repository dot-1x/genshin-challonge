"use client";

import type { Match, Tournament, RosterUnit } from "@/lib/types";
import { teamCost } from "@/lib/cost";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

export function MatchCard({
  match,
  tournament,
  rosterMap,
  onOpenDraft,
  onOpenRegistration,
}: {
  match: Match;
  tournament: Tournament;
  rosterMap: Map<string, RosterUnit>;
  onOpenDraft: () => void;
  onOpenRegistration: (playerId: string) => void;
}) {
  const playerA = match.playerAId
    ? tournament.players.find((p) => p.id === match.playerAId)
    : null;
  const playerB = match.playerBId
    ? tournament.players.find((p) => p.id === match.playerBId)
    : null;

  const canOpen = !!match.playerAId && !!match.playerBId;

  function getCost(playerId: string): number | null {
    if (!match.draft) return null;
    const slots = match.draft.fielded[playerId] ?? [];
    if (slots.length === 0) return null;
    return teamCost(slots, rosterMap, tournament.costConfig);
  }

  const costA = playerA ? getCost(playerA.id) : null;
  const costB = playerB ? getCost(playerB.id) : null;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-2.5 w-64 shrink-0 transition-colors",
        canOpen && "cursor-pointer hover:border-primary",
        match.winnerId && "opacity-70",
      )}
      onClick={() => canOpen && onOpenDraft()}
    >
      <div className="text-xs text-muted-foreground mb-1.5 text-center font-medium">
        {match.label}
      </div>
      <div className="space-y-1">
        <PlayerSlot
          player={playerA ?? null}
          isWinner={match.winnerId === playerA?.id}
          cost={costA}
          maxCost={tournament.costConfig.maxCost}
          regCount={playerA?.registration.length ?? 0}
          locked={playerA?.locked ?? false}
          onClickName={() => playerA && onOpenRegistration(playerA.id)}
        />
        <div className="border-t border-border my-1" />
        <PlayerSlot
          player={playerB ?? null}
          isWinner={match.winnerId === playerB?.id}
          cost={costB}
          maxCost={tournament.costConfig.maxCost}
          regCount={playerB?.registration.length ?? 0}
          locked={playerB?.locked ?? false}
          onClickName={() => playerB && onOpenRegistration(playerB.id)}
        />
      </div>
    </div>
  );
}

function PlayerSlot({
  player,
  isWinner,
  cost,
  maxCost,
  regCount,
  locked,
  onClickName,
}: {
  player: { name: string; id: string } | null;
  isWinner: boolean;
  cost: number | null;
  maxCost: number;
  regCount: number;
  locked: boolean;
  onClickName: () => void;
}) {
  if (!player) {
    return (
      <div className="flex items-center h-9 px-2 text-xs text-muted-foreground italic">
        TBD
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 h-9 px-2 rounded",
        isWinner && "bg-primary/10",
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClickName();
        }}
        className="flex items-center gap-1 flex-1 min-w-0 text-left hover:underline"
      >
        <span
          className={cn(
            "text-sm font-medium truncate",
            isWinner && "text-primary",
          )}
        >
          {player.name}
        </span>
        {locked && <Lock className="size-3 text-muted-foreground shrink-0" />}
      </button>
      {cost !== null ? (
        <Badge
          variant={cost > maxCost ? "destructive" : "secondary"}
          className="text-xs shrink-0"
        >
          {cost}/{maxCost}
        </Badge>
      ) : regCount > 0 ? (
        <Badge variant="outline" className="text-xs shrink-0">
          {regCount}
        </Badge>
      ) : null}
    </div>
  );
}

import type {
  DraftState,
  Match,
  Player,
  RosterUnit,
  Tournament,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { teamCost } from "@/lib/cost";
import { getStageFielded } from "@/lib/draft";
import { Crown } from "lucide-react";

export function WinnerSelection({
  match,
  matchPlayers,
  draft,
  stageCount,
  rosterMap,
  costConfig,
  onSubmitResult,
  onOpenChange,
}: {
  match: Match;
  matchPlayers: [Player, Player];
  draft: DraftState;
  stageCount: number;
  rosterMap: Map<string, RosterUnit>;
  costConfig: Tournament["costConfig"];
  onSubmitResult: (winnerId: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  if (match.winnerId) {
    const winner = matchPlayers.find((p) => p.id === match.winnerId);
    return (
      <div className="text-center py-6 space-y-2">
        <Crown className="size-10 text-yellow-500 mx-auto" />
        <p className="text-lg font-bold">{winner?.name} wins!</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-center">
        Draft complete. Select the winner:
      </p>
      <div className="grid grid-cols-2 gap-4">
        {matchPlayers.map((p) => {
          const stageSlots =
            stageCount > 1
              ? getStageFielded(draft, p.id)
              : draft.fielded[p.id] ?? [];
          const cost = teamCost(stageSlots, rosterMap, costConfig);
          return (
            <Button
              key={p.id}
              variant="outline"
              size="lg"
              onClick={() => {
                onSubmitResult(p.id);
                onOpenChange(false);
              }}
              className="h-auto py-4 flex-col gap-1"
            >
              <Crown className="size-5 text-yellow-500" />
              <span className="font-bold text-lg">{p.name}</span>
              <span className="text-xs text-muted-foreground">
                Cost: {cost}/{costConfig.maxCost}
                {stageCount > 1 && (
                  <span className="block">
                    (last stage)
                  </span>
                )}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
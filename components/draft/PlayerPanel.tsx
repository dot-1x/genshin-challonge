import type { DraftState, Player, RosterUnit, Tournament } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { UnitIcon } from "@/components/UnitIcon";
import { cn } from "@/lib/utils";
import { teamCost, slotCost } from "@/lib/cost";

export function PlayerPanel({
  player,
  draft,
  viewStage,
  rosterMap,
  costConfig,
  isActorA,
  isActorTurn,
  stageNames,
}: {
  player: Player;
  draft: DraftState;
  viewStage: number;
  rosterMap: Map<string, RosterUnit>;
  costConfig: Tournament["costConfig"];
  isActorA: boolean;
  isActorTurn: boolean;
  stageNames: string[];
}) {
  const stageCount = stageNames.length;
  const isCurrent = viewStage === draft.stageIndex;

  const stageSlots =
    stageCount > 1
      ? draft.fielded[player.id]?.slice(
          viewStage * 4,
          viewStage * 4 + 4,
        ) ?? []
      : draft.fielded[player.id] ?? [];
  const stageCost = teamCost(stageSlots, rosterMap, costConfig);

  const charBans = isCurrent
    ? draft.charBans[player.id] ?? []
    : draft.stages[viewStage]?.charBans[player.id] ?? [];
  const globalBanned = draft.globalBans[player.id] ?? [];

  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-2",
        isActorTurn && "border-primary bg-primary/5",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium flex items-center gap-1.5">
          {isActorA ? "A" : "B"} — {player.name}
          {isActorTurn && <Badge variant="default">Turn</Badge>}
        </span>
        <Badge variant={stageCost > costConfig.maxCost ? "destructive" : "secondary"}>
          {stageCost}/{costConfig.maxCost}
        </Badge>
      </div>

      <div className="space-y-1">
        {stageCount > 1 && (
          <div className="flex items-center gap-1 mb-1">
            <Badge variant="outline" className="text-[10px]">
              {stageNames[viewStage] ?? `Stage ${viewStage + 1}`}
            </Badge>
          </div>
        )}
        {stageSlots.length === 0 ? (
          <p className="text-xs text-muted-foreground">No characters picked yet.</p>
        ) : (
          stageSlots.map((slot, i) => {
            const charUnit = slot.charUnitId
              ? rosterMap.get(slot.charUnitId)
              : null;
            const weaponUnit = slot.weaponUnitId
              ? rosterMap.get(slot.weaponUnitId)
              : null;
            const sc = slotCost(slot, rosterMap, costConfig);
            return (
              <div
                key={`stage-${i}`}
                className="flex items-center gap-2 rounded-md bg-muted/50 p-1.5"
              >
                {charUnit ? (
                  <>
                    <UnitIcon unit={charUnit} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">
                        {charUnit.name}
                        {charUnit.banner === "limited" && (
                          <span className="text-muted-foreground">
                            {" "}
                            C{slot.charCons}
                          </span>
                        )}
                      </div>
                      {weaponUnit && (
                        <div className="text-xs text-muted-foreground truncate">
                          {weaponUnit.name} R{slot.refine}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {sc}
                    </Badge>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Empty slot</span>
                )}
              </div>
            );
          })
        )}
      </div>

      {(globalBanned.length > 0 || charBans.length > 0) && (
        <div className="space-y-1">
          {globalBanned.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-destructive">Global banned:</span>
              {globalBanned.map((id) => {
                const u = rosterMap.get(id);
                return u ? (
                  <span key={id} className="flex items-center gap-0.5 text-xs">
                    <UnitIcon unit={u} size={16} className="opacity-40 grayscale" />
                  </span>
                ) : null;
              })}
            </div>
          )}
          {charBans.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-destructive">Char banned:</span>
              {charBans.map((id) => {
                const u = rosterMap.get(id);
                return u ? (
                  <span key={id} className="flex items-center gap-0.5 text-xs">
                    <UnitIcon unit={u} size={16} className="opacity-40 grayscale" />
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
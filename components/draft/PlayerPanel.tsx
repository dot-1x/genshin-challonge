"use client";

import type { DraftState, Player, RosterUnit, Tournament } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UnitIcon } from "@/components/UnitIcon";
import { cn } from "@/lib/utils";
import { teamCost, slotCost } from "@/lib/cost";
import {
  getAvailableWeapons,
  isStageEditable,
  isStageFinalized,
  isStageFullyPicked,
} from "@/lib/draft";
import { Lock } from "lucide-react";

export function PlayerPanel({
  player,
  draft,
  viewStage,
  rosterMap,
  costConfig,
  isActorA,
  isActorTurn,
  stageNames,
  onSelectWeapon,
  onSetRefine,
  onFinalizeStage,
}: {
  player: Player;
  draft: DraftState;
  viewStage: number;
  rosterMap: Map<string, RosterUnit>;
  costConfig: Tournament["costConfig"];
  isActorA: boolean;
  isActorTurn: boolean;
  stageNames: string[];
  onSelectWeapon: (playerId: string, slotIdx: number, weaponId: string) => void;
  onSetRefine: (playerId: string, slotIdx: number, refine: number) => void;
  onFinalizeStage: (playerId: string, stageIndex: number) => void;
}) {
  const stageCount = stageNames.length;
  const isCurrent = viewStage === draft.stageIndex;

  const stageStart = stageCount > 1 ? viewStage * 4 : 0;
  const stageSlots =
    stageCount > 1
      ? (draft.fielded[player.id]?.slice(stageStart, stageStart + 4) ?? [])
      : (draft.fielded[player.id] ?? []);
  const stageCost = teamCost(stageSlots, rosterMap, costConfig);
  const overBudget = stageCost > costConfig.maxCost;

  const fullyPicked = isStageFullyPicked(draft, player.id, viewStage);
  const finalized = isStageFinalized(draft, player.id, viewStage);
  const editable = isStageEditable(draft, player.id, viewStage);
  const allEquipped =
    stageSlots.length > 0 && stageSlots.every((s) => s.weaponUnitId);

  const charBans = isCurrent
    ? (draft.charBans[player.id] ?? [])
    : (draft.stages[viewStage]?.charBans[player.id] ?? []);
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
          {finalized && (
            <Badge variant="outline" className="gap-1">
              <Lock className="size-3" />
              Locked
            </Badge>
          )}
        </span>
        <Badge variant={overBudget ? "destructive" : "secondary"}>
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
          <p className="text-xs text-muted-foreground">
            No characters picked yet.
          </p>
        ) : (
          stageSlots.map((slot, i) => {
            const slotIdx = stageStart + i;
            const charUnit = slot.charUnitId
              ? rosterMap.get(slot.charUnitId)
              : null;
            const weaponUnit = slot.weaponUnitId
              ? rosterMap.get(slot.weaponUnitId)
              : null;
            const sc = slotCost(slot, rosterMap, costConfig);
            const availableWeapons = charUnit
              ? getAvailableWeapons(charUnit, rosterMap)
              : [];
            return (
              <div
                key={`stage-${i}`}
                className="flex items-center gap-2 rounded-md bg-muted/50 p-1.5"
              >
                {charUnit ? (
                  <>
                    <UnitIcon unit={charUnit} size={28} />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium truncate">
                          {charUnit.name}
                          {charUnit.banner === "limited" && (
                            <span className="text-muted-foreground">
                              {" "}
                              C{slot.charCons}
                            </span>
                          )}
                        </span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {sc}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Select
                          value={slot.weaponUnitId ?? ""}
                          onValueChange={(v) => {
                            if (v) onSelectWeapon(player.id, slotIdx, v);
                          }}
                          disabled={!editable}
                        >
                          <SelectTrigger className="h-6 text-xs flex-1">
                            <SelectValue placeholder="Weapon">
                              {(value: string | null) => {
                                if (!value) return null;
                                const w = rosterMap.get(value);
                                return w
                                  ? `${w.rank}★ ${w.name}${w.banner === "limited" ? " (Limited)" : ""}`
                                  : value;
                              }}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {availableWeapons.map((w) => (
                              <SelectItem key={w.id} value={w.id}>
                                {w.rank}★ {w.name}{" "}
                                {w.banner === "limited" ? "(Limited)" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={String(slot.refine)}
                          onValueChange={(v) => {
                            if (v) onSetRefine(player.id, slotIdx, Number(v));
                          }}
                          disabled={!editable || !slot.weaponUnitId}
                        >
                          <SelectTrigger className="h-6 w-12 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map((r) => (
                              <SelectItem key={r} value={String(r)}>
                                R{r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {weaponUnit && !editable && (
                        <div className="text-[10px] text-muted-foreground truncate">
                          {weaponUnit.name} R{slot.refine}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Empty slot
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {fullyPicked && !finalized && (
        <Button
          size="sm"
          className="w-full"
          disabled={overBudget || !allEquipped}
          onClick={() => onFinalizeStage(player.id, viewStage)}
        >
          <Lock className="size-4" />
          Confirm Final Draft
          {overBudget
            ? " — Over budget!"
            : !allEquipped
              ? " — Equip all weapons"
              : ""}
        </Button>
      )}

      {(globalBanned.length > 0 || charBans.length > 0) && (
        <div className="space-y-1">
          {globalBanned.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-destructive">Global banned:</span>
              {globalBanned.map((id) => {
                const u = rosterMap.get(id);
                return u ? (
                  <span key={id} className="flex items-center gap-0.5 text-xs">
                    <UnitIcon
                      unit={u}
                      size={32}
                      className="opacity-40 grayscale"
                    />
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
                    <UnitIcon
                      unit={u}
                      size={32}
                      className="opacity-40 grayscale"
                    />
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
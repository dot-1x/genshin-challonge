"use client";

import { useMemo, useState } from "react";
import type {
  DraftState,
  FieldedSlot,
  Player,
  RosterUnit,
  Tournament,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CharacterPool, type PoolFilter } from "@/components/CharacterPool";
import { Separator } from "@/components/ui/separator";
import { teamCost } from "@/lib/cost";
import {
  emptySlot,
  getAllCharsPool,
  getRegisteredPool,
  getStageFielded,
  getCurrentStep,
} from "@/lib/draft";
import { Check } from "lucide-react";
import { PickSlot } from "./PickSlot";

export function PickUI({
  actorPlayer,
  draft,
  stageCount,
  rosterMap,
  costConfig,
  pickSlots,
  setPickSlots,
  pickSearch,
  setPickSearch,
  onConfirm,
}: {
  actorPlayer: Player;
  draft: DraftState;
  stageCount: number;
  rosterMap: Map<string, RosterUnit>;
  costConfig: Tournament["costConfig"];
  pickSlots: FieldedSlot[];
  setPickSlots: (slots: FieldedSlot[]) => void;
  pickSearch: string;
  setPickSearch: (s: string) => void;
  onConfirm: () => void;
}) {
  const step = getCurrentStep(draft, stageCount);
  const [filter, setFilter] = useState<PoolFilter>("registered");

  const curStepIdx = draft.stepIndex;
  const [prevStep, setPrevStep] = useState(curStepIdx);
  if (curStepIdx !== prevStep) {
    setPrevStep(curStepIdx);
    setFilter("registered");
  }

  const registeredPool = useMemo(
    () => getRegisteredPool(actorPlayer, draft, rosterMap),
    [actorPlayer, draft, rosterMap],
  );
  const allPool = useMemo(
    () => getAllCharsPool(actorPlayer, draft, rosterMap),
    [actorPlayer, draft, rosterMap],
  );

  const existingFielded =
    stageCount > 1
      ? getStageFielded(draft, actorPlayer.id)
      : draft.fielded[actorPlayer.id] ?? [];
  const projectedCost = teamCost(
    [...existingFielded, ...pickSlots],
    rosterMap,
    costConfig,
  );
  const overBudget = projectedCost > costConfig.maxCost;

  const filledSlots = pickSlots.filter((s) => s.charUnitId).length;
  const canConfirm = filledSlots === step.count && !overBudget;

  function selectChar(unit: RosterUnit, cons: number) {
    const emptyIdx = pickSlots.findIndex((s) => !s.charUnitId);
    if (emptyIdx === -1) return;
    const next = [...pickSlots];
    next[emptyIdx] = { ...next[emptyIdx], charUnitId: unit.id, charCons: cons, weaponUnitId: null, refine: 1 };
    setPickSlots(next);
  }

  function clearSlot(idx: number) {
    const next = [...pickSlots];
    next[idx] = emptySlot();
    setPickSlots(next);
  }

  const pickedIds = new Set(pickSlots.filter((s) => s.charUnitId).map((s) => s.charUnitId!));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {actorPlayer.name} — Pick {step.count} characters:
        </p>
        <Badge variant={overBudget ? "destructive" : "secondary"}>
          {projectedCost}/{costConfig.maxCost}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {pickSlots.map((slot, idx) => (
          <PickSlot
            key={idx}
            idx={idx}
            slot={slot}
            rosterMap={rosterMap}
            costConfig={costConfig}
            onClear={clearSlot}
          />
        ))}
      </div>

      <Separator />

      <div className="space-y-2">
        <CharacterPool
          registeredPool={registeredPool}
          allPool={allPool}
          onSelect={({ unit, cons }) => selectChar(unit, cons)}
          disabledIds={
            filledSlots >= step.count
              ? new Set(allPool.map((p) => p.unit.id))
              : pickedIds
          }
          filter={filter}
          onFilterChange={setFilter}
          search={pickSearch}
          onSearchChange={setPickSearch}
        />
      </div>

      <Button
        onClick={onConfirm}
        disabled={!canConfirm}
        className="w-full"
      >
        <Check className="size-4" />
        Confirm Pick ({filledSlots}/{step.count})
        {overBudget && " — Over budget!"}
      </Button>
    </div>
  );
}
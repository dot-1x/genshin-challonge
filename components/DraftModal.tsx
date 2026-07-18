"use client";

import { useState, useMemo } from "react";
import type {
  Match,
  Tournament,
  RosterUnit,
  FieldedSlot,
  DraftState,
  Player,
} from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UnitIcon } from "@/components/UnitIcon";
import { CharacterPool, elementLabel, type PoolChar, type PoolFilter } from "@/components/CharacterPool";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { teamCost, slotCost } from "@/lib/cost";
import {
  DRAFT_STEPS,
  getCurrentStep,
  isDraftComplete,
  getActorPlayerId,
  getOpponentPlayerId,
  selectActorA,
  applyGlobalBan,
  applyCharBan,
  applyPick,
  getBannableRegisteredChars,
  getRegisteredPool,
  getAllCharsPool,
  getAvailableWeapons,
  emptySlot,
  getStageCount,
  getStageFielded,
  getTotalSteps,
  getStageNames,
} from "@/lib/draft";
import { createDraft } from "@/lib/draft";
import { Ban, Check, X, Crown, Swords } from "lucide-react";

export function DraftModal({
  match,
  tournament,
  rosterMap,
  onSetDraft,
  onSubmitResult,
  onOpenChange,
}: {
  match: Match | null;
  tournament: Tournament;
  rosterMap: Map<string, RosterUnit>;
  onSetDraft: (draft: DraftState) => void;
  onSubmitResult: (winnerId: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const draft = match?.draft ?? null;
  const costConfig = tournament.costConfig;
  const stageCount = getStageCount(tournament.type);
  const stageNames = getStageNames(stageCount);

  const [pickSlots, setPickSlots] = useState<FieldedSlot[]>([
    emptySlot(),
    emptySlot(),
  ]);
  const [pickSearch, setPickSearch] = useState("");
  const [prevStepIndex, setPrevStepIndex] = useState(draft?.stepIndex ?? 0);
  const [viewStage, setViewStage] = useState(0);

  if (draft && draft.stepIndex !== prevStepIndex) {
    setPrevStepIndex(draft.stepIndex);
    setPickSlots([emptySlot(), emptySlot()]);
    setPickSearch("");
    setViewStage(draft.stageIndex);
  }

  const playerById = useMemo(() => {
    const m = new Map<string, Player>();
    for (const p of tournament.players) m.set(p.id, p);
    return m;
  }, [tournament.players]);

  if (!match || !match.playerAId || !match.playerBId) return null;

  if (!draft) {
    return (
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{match.label}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Both players are ready. Start the draft pick phase?
            {stageCount > 1 && ` (${stageCount} stages)`}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                onSetDraft(createDraft([match.playerAId!, match.playerBId!]))
              }
            >
              <Swords className="size-4" />
              Start Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const step = getCurrentStep(draft, stageCount);
  const complete = isDraftComplete(draft, stageCount);

  const actorId = step.actor ? getActorPlayerId(draft, step.actor) : null;
  const actorPlayer = actorId ? playerById.get(actorId) ?? null : null;
  const opponentId = step.actor
    ? getOpponentPlayerId(draft, step.actor)
    : null;
  const opponentPlayer = opponentId ? playerById.get(opponentId) ?? null : null;

  const matchPlayers: [Player, Player] = [
    playerById.get(draft.matchPlayerIds[0])!,
    playerById.get(draft.matchPlayerIds[1])!,
  ];

  const stepDescription = getStepDescription(
    step.type,
    step.actor,
    actorPlayer,
    opponentPlayer,
    stageCount > 1 ? stageNames[draft.stageIndex] : undefined,
  );

  function handleAction(newDraft: DraftState) {
    onSetDraft(newDraft);
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {match.label}
            <Badge variant="secondary">
              Step {Math.min(draft.stepIndex + 1)}/{getTotalSteps(stageCount)}
            </Badge>
            {stageCount > 1 && (
              <Badge variant="outline">
              {stageNames[viewStage] ?? `Stage ${viewStage + 1}`}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">{stepDescription}</p>

        {stageCount > 1 && draft.stageIndex > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {Array.from({ length: draft.stageIndex + (complete ? 1 : 0) }, (_, i) => {
              const isCurrent = i === draft.stageIndex;
              const label = stageNames[i] ?? `Stage ${i + 1}`;
              return (
                <button
                  key={i}
                  onClick={() => setViewStage(i)}
                  className={cn(
                    "text-xs px-2 py-1 rounded-full border transition-colors",
                    viewStage === i
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary text-muted-foreground",
                  )}
                >
                  {label}
                  {!isCurrent && i < draft.stageIndex && " ✓"}
                  {isCurrent && " ←"}
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {matchPlayers.map((p) => (
            <PlayerPanel
              key={p.id}
              player={p}
              draft={draft}
              viewStage={viewStage}
              rosterMap={rosterMap}
              costConfig={costConfig}
              isActorA={draft.playerAId === p.id}
              isActorTurn={actorId === p.id && !complete}
              stageNames={stageNames}
            />
          ))}
        </div>

        <Separator />

        <div className="flex-1 overflow-y-auto min-h-0">
          {complete ? (
            <WinnerSelection
              match={match}
              matchPlayers={matchPlayers}
              draft={draft}
              stageCount={stageCount}
              rosterMap={rosterMap}
              costConfig={costConfig}
              onSubmitResult={onSubmitResult}
              onOpenChange={onOpenChange}
            />
          ) : step.type === "select-a" ? (
            <SelectAUI
              matchPlayers={matchPlayers}
              onSelect={(id) => handleAction(selectActorA(draft, id))}
            />
          ) : step.type === "global-ban" && opponentPlayer ? (
            <GlobalBanUI
              opponentPlayer={opponentPlayer}
              draft={draft}
              rosterMap={rosterMap}
              onBan={(unitId) =>
                handleAction(applyGlobalBan(draft, unitId))
              }
            />
          ) : step.type === "char-ban" && opponentPlayer ? (
            <CharBanUI
              opponentPlayer={opponentPlayer}
              draft={draft}
              stageCount={stageCount}
              rosterMap={rosterMap}
              onBan={(unitId) =>
                handleAction(applyCharBan(draft, unitId, stageCount))
              }
            />
          ) : step.type === "pick" && actorPlayer ? (
            <PickUI
              actorPlayer={actorPlayer}
              draft={draft}
              stageCount={stageCount}
              rosterMap={rosterMap}
              costConfig={costConfig}
              pickSlots={pickSlots}
              setPickSlots={setPickSlots}
              pickSearch={pickSearch}
              setPickSearch={setPickSearch}
              onConfirm={() => {
                handleAction(applyPick(draft, pickSlots, stageCount));
              }}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getStepDescription(
  type: string,
  actor: string | null,
  actorPlayer: Player | null,
  opponentPlayer: Player | null,
  stageName?: string,
): string {
  const actorName = actorPlayer?.name ?? "?";
  const oppName = opponentPlayer?.name ?? "?";
  const stage = stageName ? ` [${stageName}]` : "";
  switch (type) {
    case "select-a":
      return "Select Player A (acts first in the draft)";
    case "global-ban":
      return `${actorName} — Global Ban: ban 1 registered limited 5★ char from ${oppName}`;
    case "char-ban":
      return `${actorName} — Char Ban: ban 1 char from ${oppName}'s fieldable pool${stage}`;
    case "pick":
      return `${actorName} — Pick 2 characters + equip weapons${stage}`;
    default:
      return "";
  }
}

function PlayerPanel({
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
  const allSlots = draft.fielded[player.id] ?? [];
  const stageCost = teamCost(stageSlots, rosterMap, costConfig);

  const charBans = isCurrent
    ? draft.charBans[player.id] ?? []
    : draft.stages[viewStage]?.charBans[player.id] ?? [];
  const globalBanned = draft.globalBans[player.id] ?? [];

  const prevStageSlots =
    stageCount > 1
      ? allSlots.filter(
          (s) => !stageSlots.some((ss) => ss.charUnitId === s.charUnitId),
        )
      : [];

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
              {stageNames[draft.stageIndex] ?? `Stage ${draft.stageIndex + 1}`}
            </Badge>
          </div>
        )}
        {allSlots.length === 0 ? (
          <p className="text-xs text-muted-foreground">No characters picked yet.</p>
        ) : (
          <>
            {stageSlots.map((slot, i) => {
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
            })}
            {prevStageSlots.length > 0 && (
              <>
                <Separator className="my-1" />
                {prevStageSlots.map((slot, i) => {
                  const charUnit = slot.charUnitId
                    ? rosterMap.get(slot.charUnitId)
                    : null;
                  const weaponUnit = slot.weaponUnitId
                    ? rosterMap.get(slot.weaponUnitId)
                    : null;
                  return (
                    <div
                      key={`prev-${i}`}
                      className="flex items-center gap-2 rounded-md bg-muted/30 p-1.5 opacity-50"
                    >
                      {charUnit ? (
                        <>
                          <UnitIcon unit={charUnit} size={24} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate line-through">
                              {charUnit.name}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            Used
                          </Badge>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Empty</span>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </>
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

function SelectAUI({
  matchPlayers,
  onSelect,
}: {
  matchPlayers: [Player, Player];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Choose which player acts first (Player A):
      </p>
      <div className="grid grid-cols-2 gap-4">
        {matchPlayers.map((p) => (
          <Button
            key={p.id}
            variant="outline"
            size="lg"
            onClick={() => onSelect(p.id)}
            className="h-auto py-4"
          >
            <span className="font-bold text-lg">{p.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

function GlobalBanUI({
  opponentPlayer,
  draft,
  rosterMap,
  onBan,
}: {
  opponentPlayer: Player;
  draft: DraftState;
  rosterMap: Map<string, RosterUnit>;
  onBan: (unitId: string) => void;
}) {
  const bannable = getBannableRegisteredChars(opponentPlayer, draft);

  if (bannable.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {opponentPlayer.name} has no registered limited characters to ban.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Ban a registered limited 5★ from {opponentPlayer.name}:
      </p>
      <div className="flex flex-wrap gap-2">
        {bannable.map((id) => {
          const unit = rosterMap.get(id);
          if (!unit) return null;
          return (
            <button
              key={id}
              onClick={() => onBan(id)}
              className="flex items-center gap-2 rounded-lg border p-1.5 hover:border-destructive hover:bg-destructive/5 transition-colors"
            >
              <UnitIcon unit={unit} size={32} />
              <span className="text-sm font-medium">{unit.name}</span>
              <Ban className="size-3.5 text-destructive" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CharBanUI({
  opponentPlayer,
  draft,
  rosterMap,
  onBan,
  stageCount,
}: {
  opponentPlayer: Player;
  draft: DraftState;
  rosterMap: Map<string, RosterUnit>;
  onBan: (unitId: string) => void;
  stageCount: number;
}) {
  const [filter, setFilter] = useState<PoolFilter>("registered");

  const allPool: PoolChar[] = getAllCharsPool(opponentPlayer, draft, rosterMap);
  const regPool = getRegisteredPool(opponentPlayer, draft, rosterMap);

  if (allPool.length === 0 && regPool.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground text-center py-4">
          No characters available to ban from {opponentPlayer.name}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Ban a character from {opponentPlayer.name}&apos;s pool:
      </p>
      <CharacterPool
        registeredPool={regPool}
        allPool={allPool}
        onSelect={(item) => onBan(item.unit.id)}
        filter={filter}
        onFilterChange={setFilter}
      />
    </div>
  );
}

function PickUI({
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
  const allHaveWeapons = pickSlots.every((s) => s.charUnitId && s.weaponUnitId);
  const canConfirm = filledSlots === step.count && allHaveWeapons && !overBudget;

  function selectChar(unit: RosterUnit, cons: number) {
    const emptyIdx = pickSlots.findIndex((s) => !s.charUnitId);
    if (emptyIdx === -1) return;
    const next = [...pickSlots];
    next[emptyIdx] = { ...next[emptyIdx], charUnitId: unit.id, charCons: cons, weaponUnitId: null, refine: 1 };
    setPickSlots(next);
  }

  function selectWeapon(slotIdx: number, weaponId: string) {
    const next = [...pickSlots];
    next[slotIdx] = { ...next[slotIdx], weaponUnitId: weaponId, refine: 1 };
    setPickSlots(next);
  }

  function setRefine(slotIdx: number, refine: number) {
    const next = [...pickSlots];
    next[slotIdx] = { ...next[slotIdx], refine };
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
        {pickSlots.map((slot, idx) => {
          const charUnit = slot.charUnitId ? rosterMap.get(slot.charUnitId) : null;
          const availableWeapons = charUnit
            ? getAvailableWeapons(charUnit, rosterMap)
            : [];
          const sc = slotCost(slot, rosterMap, costConfig);
          return (
            <div
              key={idx}
              className="rounded-lg border p-2 space-y-2"
            >
              <div className="flex items-center gap-2">
                {charUnit ? (
                  <>
                    <UnitIcon unit={charUnit} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {charUnit.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {charUnit.rank}★ {elementLabel(charUnit.element ?? "")}
                        {charUnit.banner === "limited" && ` C${slot.charCons}`}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">{sc}</Badge>
                    <button
                      onClick={() => clearSlot(idx)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3.5" />
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Slot {idx + 1} — select a char</span>
                )}
              </div>
              {charUnit && (
                <div className="flex items-center gap-1.5">
                  <Select
                    value={slot.weaponUnitId ?? ""}
                    onValueChange={(v) => { if (v) selectWeapon(idx, v); }}
                  >
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue placeholder="Weapon" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableWeapons.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.rank}★ {w.name} {w.banner === "limited" ? "(Limited)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(slot.refine)}
                    onValueChange={(v) => { if (v) setRefine(idx, Number(v)); }}
                    disabled={!slot.weaponUnitId}
                  >
                    <SelectTrigger className="h-7 w-14 text-xs">
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
              )}
            </div>
          );
        })}
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

function WinnerSelection({
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

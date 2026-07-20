"use client";

import { useMemo, useState } from "react";
import type {
  DraftState,
  FieldedSlot,
  Match,
  Player,
  RosterUnit,
  Tournament,
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
import { Separator } from "@/components/ui/separator";
import {
  getCurrentStep,
  isDraftComplete,
  getActorPlayerId,
  getOpponentPlayerId,
  selectActorA,
  applyGlobalBan,
  applyCharBan,
  applyPick,
  emptySlot,
  getStageCount,
  getTotalSteps,
  getStageNames,
  createDraft,
} from "@/lib/draft";
import { Swords } from "lucide-react";
import { StageSwitcher } from "./StageSwitcher";
import { PlayerPanel } from "./PlayerPanel";
import { SelectAUI } from "./SelectAUI";
import { GlobalBanUI } from "./GlobalBanUI";
import { CharBanUI } from "./CharBanUI";
import { PickUI } from "./PickUI";
import { WinnerSelection } from "./WinnerSelection";
import { getStepDescription } from "./stepDescription";

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
          <StageSwitcher
            currentStageIndex={draft.stageIndex}
            complete={complete}
            viewStage={viewStage}
            stageNames={stageNames}
            onSelect={setViewStage}
          />
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
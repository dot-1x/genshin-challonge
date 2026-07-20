"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type {
  DraftState,
  FieldedSlot,
  Match,
  Player,
  RosterUnit,
  Tournament,
} from "@/lib/types";
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
import { ArrowLeft, Swords } from "lucide-react";
import { StageSwitcher } from "./StageSwitcher";
import { PlayerPanel } from "./PlayerPanel";
import { SelectAUI } from "./SelectAUI";
import { GlobalBanUI } from "./GlobalBanUI";
import { CharBanUI } from "./CharBanUI";
import { PickUI } from "./PickUI";
import { WinnerSelection } from "./WinnerSelection";
import { RegistrationStrip } from "./RegistrationStrip";
import { getStepDescription } from "./stepDescription";

export function DraftView({
  match,
  tournament,
  rosterMap,
  onSetDraft,
  onSubmitResult,
  backHref,
}: {
  match: Match;
  tournament: Tournament;
  rosterMap: Map<string, RosterUnit>;
  onSetDraft: (draft: DraftState) => void;
  onSubmitResult: (winnerId: string) => void;
  backHref: string;
}) {
  const draft = match.draft ?? null;
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
    setViewStage(Math.min(draft.stageIndex, stageCount - 1));
  }

  const playerById = useMemo(() => {
    const m = new Map<string, Player>();
    for (const p of tournament.players) m.set(p.id, p);
    return m;
  }, [tournament.players]);

  if (!match.playerAId || !match.playerBId) {
    return (
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 space-y-4">
        <Button render={<Link href={backHref} />} variant="ghost" size="sm">
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <p className="text-sm text-muted-foreground">
          Match is not ready for draft.
        </p>
      </main>
    );
  }

  const matchPlayers: [Player, Player] = [
    playerById.get(match.playerAId)!,
    playerById.get(match.playerBId)!,
  ];

  if (!draft) {
    return (
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button render={<Link href={backHref} />} variant="ghost" size="sm">
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <h1 className="text-lg font-bold">{match.label}</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {matchPlayers.map((p) => (
            <RegistrationStrip
              key={p.id}
              player={p}
              rosterMap={rosterMap}
              isActorA={false}
              isActorTurn={false}
            />
          ))}
        </div>

        <div className="rounded-lg border bg-card p-6 flex flex-col items-center gap-4 text-center">
          <Swords className="size-10 text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-medium">Both players are ready</p>
            <p className="text-sm text-muted-foreground">
              Start the draft pick phase?
              {stageCount > 1 && ` (${stageCount} stages)`}
            </p>
          </div>
          <Button
            onClick={() =>
              onSetDraft(createDraft([match.playerAId!, match.playerBId!]))
            }
          >
            <Swords className="size-4" />
            Start Draft
          </Button>
        </div>
      </main>
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
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button render={<Link href={backHref} />} variant="ghost" size="sm">
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <h1 className="text-lg font-bold">{match.label}</h1>
          <Badge variant="secondary">
            Step {Math.min(draft.stepIndex + 1)}/{getTotalSteps(stageCount)}
          </Badge>
          {stageCount > 1 && (
            <Badge variant="outline">
              {stageNames[viewStage] ?? `Stage ${viewStage + 1}`}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {matchPlayers.map((p) => (
          <RegistrationStrip
            key={p.id}
            player={p}
            rosterMap={rosterMap}
            isActorA={draft.playerAId === p.id}
            isActorTurn={actorId === p.id && !complete}
          />
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{stepDescription}</p>

      {stageCount > 1 && (
        <StageSwitcher
          currentStageIndex={Math.min(draft.stageIndex, stageCount - 1)}
          viewStage={viewStage}
          stageNames={stageNames}
          onSelect={setViewStage}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="flex-1">
        {complete ? (
          <WinnerSelection
            match={match}
            matchPlayers={matchPlayers}
            draft={draft}
            stageCount={stageCount}
            rosterMap={rosterMap}
            costConfig={costConfig}
            onSubmitResult={onSubmitResult}
            onOpenChange={() => {}}
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
            onBan={(unitId) => handleAction(applyGlobalBan(draft, unitId))}
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
    </main>
  );
}
import type { DraftSimulation, RosterUnit } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { teamCost } from "@/lib/cost";
import { DRAFT_STEPS, isDraftComplete } from "@/lib/draft";
import { Edit2, Trash2 } from "lucide-react";
import { PLAYER_A_ID, PLAYER_B_ID, type PlayerSlot } from "./utils";
import { SimCardTeamRow } from "./SimCardTeamRow";

export function SimCard({
  sim,
  rosterMap,
  onOpen,
  onDelete,
  onSavePreset,
}: {
  sim: DraftSimulation;
  rosterMap: Map<string, RosterUnit>;
  onOpen: () => void;
  onDelete: () => void;
  onSavePreset: (player: PlayerSlot) => void;
}) {
  const draftComplete = sim.draft ? isDraftComplete(sim.draft) : false;
  const draftStep = sim.draft
    ? Math.min(sim.draft.stepIndex + 1, DRAFT_STEPS.length)
    : null;

  const teamA = sim.draft?.fielded[PLAYER_A_ID] ?? [];
  const teamB = sim.draft?.fielded[PLAYER_B_ID] ?? [];
  const costA = teamCost(teamA, rosterMap, sim.costConfig);
  const costB = teamCost(teamB, rosterMap, sim.costConfig);

  return (
    <Card className="group relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm truncate">
              {sim.playerAName} vs {sim.playerBName}
            </CardTitle>
            <CardDescription className="mt-0.5">
              {new Date(sim.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon-sm" onClick={onOpen}>
              <Edit2 className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onDelete}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px]">
            {sim.playerARegistration.length} reg
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {sim.playerBRegistration.length} reg
          </Badge>
          {draftStep && (
            <Badge
              variant={draftComplete ? "default" : "outline"}
              className="text-[10px]"
            >
              {draftComplete
                ? "Complete"
                : `Step ${draftStep}/${DRAFT_STEPS.length}`}
            </Badge>
          )}
          {!draftStep && (
            <Badge variant="outline" className="text-[10px]">
              Registration
            </Badge>
          )}
        </div>

        <SimCardTeamRow
          name={sim.playerAName}
          registration={sim.playerARegistration}
          team={teamA}
          cost={costA}
          maxCost={sim.costConfig.maxCost}
          rosterMap={rosterMap}
          onSavePreset={() => onSavePreset("A")}
        />

        <Separator />

        <SimCardTeamRow
          name={sim.playerBName}
          registration={sim.playerBRegistration}
          team={teamB}
          cost={costB}
          maxCost={sim.costConfig.maxCost}
          rosterMap={rosterMap}
          onSavePreset={() => onSavePreset("B")}
        />

        <Button variant="outline" size="sm" className="w-full" onClick={onOpen}>
          {draftComplete
            ? "View Result"
            : sim.draft
              ? "Continue Draft"
              : "Start Draft"}
        </Button>
      </CardContent>
    </Card>
  );
}
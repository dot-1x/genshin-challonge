"use client";

import { useState } from "react";
import type {
  DraftSimulation,
  Player,
  Match,
  Tournament,
  RegisteredChar,
  DraftState,
  RosterUnit,
} from "@/lib/types";
import { DEFAULT_COST_CONFIG } from "@/lib/types";
import { useSimulations } from "@/lib/simulator";
import { usePresets } from "@/lib/presets";
import { useRoster } from "@/lib/roster";
import { DraftModal } from "@/components/DraftModal";
import { RegistrationModal } from "@/components/RegistrationModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UnitIcon } from "@/components/UnitIcon";
import { Separator } from "@/components/ui/separator";
import { teamCost } from "@/lib/cost";
import { DRAFT_STEPS, isDraftComplete } from "@/lib/draft";
import {
  Plus,
  Edit2,
  Trash2,
  Shield,
  Download,
  Library,
} from "lucide-react";

const PLAYER_A_ID = "player-a";
const PLAYER_B_ID = "player-b";

type Mode =
  | "list"
  | "names"
  | "preset-a"
  | "register-a"
  | "preset-b"
  | "register-b"
  | "draft"
  | "save-preset-a"
  | "save-preset-b";

function makePlayer(
  id: string,
  name: string,
  registration: RegisteredChar[],
  seed: number,
): Player {
  return { id, name, seed, registration, locked: false };
}

function makeMatch(draft: DraftState | null): Match {
  return {
    id: "sim-match",
    round: 0,
    side: "final",
    bracket: "winners",
    playerAId: PLAYER_A_ID,
    playerBId: PLAYER_B_ID,
    winnerId: null,
    feedsInto: null,
    loserDropsTo: null,
    draft,
    label: "Draft Simulation",
  };
}

function makeTournament(sim: DraftSimulation): Tournament {
  return {
    id: "sim-tournament",
    name: `${sim.playerAName} vs ${sim.playerBName}`,
    format: "single",
    playerCount: 2,
    costConfig: sim.costConfig,
    players: [
      makePlayer(PLAYER_A_ID, sim.playerAName, sim.playerARegistration, 0),
      makePlayer(PLAYER_B_ID, sim.playerBName, sim.playerBRegistration, 1),
    ],
    matches: [makeMatch(sim.draft)],
    status: "knockout",
    championId: null,
    grandFinalReset: false,
    createdAt: sim.createdAt,
  };
}

export function SimulatorView() {
  const { list, loaded, save, update, remove } = useSimulations();
  const {
    list: presets,
    loaded: presetsLoaded,
    save: savePreset,
    remove: removePreset,
  } = usePresets();
  const {
    roster,
    rosterMap,
    loading: rosterLoading,
    error: rosterError,
    refresh,
  } = useRoster();

  const [mode, setMode] = useState<Mode>("list");
  const [simId, setSimId] = useState<string | null>(null);
  const [newNameA, setNewNameA] = useState("");
  const [newNameB, setNewNameB] = useState("");
  const [savePresetName, setSavePresetName] = useState("");
  const [savePresetPlayer, setSavePresetPlayer] = useState<"A" | "B" | null>(
    null,
  );

  const sim = simId ? list.find((s) => s.id === simId) ?? null : null;

  function handleCreate() {
    const id = save({
      playerAName: newNameA.trim() || "You",
      playerBName: newNameB.trim() || "Opponent",
      playerARegistration: [],
      playerBRegistration: [],
      draft: null,
      costConfig: DEFAULT_COST_CONFIG,
    });
    setSimId(id);
    setMode("preset-a");
    setNewNameA("");
    setNewNameB("");
  }

  function handleOpenSim(id: string) {
    const s = list.find((x) => x.id === id);
    if (!s) return;
    setSimId(id);
    if (s.draft) {
      setMode("draft");
    } else if (
      s.playerARegistration.length + s.playerBRegistration.length ===
      0
    ) {
      setMode("preset-a");
    } else if (s.playerBRegistration.length === 0) {
      setMode("preset-b");
    } else {
      setMode("draft");
    }
  }

  function handleLoadPresetA(presetId: string | null) {
    if (!presetId || !sim) return;
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    const updated: DraftSimulation = {
      ...sim,
      playerARegistration: preset.characters,
    };
    update(sim.id, updated);
    setMode("preset-b");
  }

  function handleLoadPresetB(presetId: string | null) {
    if (!presetId || !sim) return;
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    const updated: DraftSimulation = {
      ...sim,
      playerBRegistration: preset.characters,
    };
    update(sim.id, updated);
    setMode("draft");
  }

  function handleSaveRegistrationA(reg: RegisteredChar[]) {
    if (!sim) return;
    const updated: DraftSimulation = {
      ...sim,
      playerARegistration: reg,
    };
    update(sim.id, updated);
    setMode("preset-b");
  }

  function handleSaveRegistrationB(reg: RegisteredChar[]) {
    if (!sim) return;
    const updated: DraftSimulation = {
      ...sim,
      playerBRegistration: reg,
    };
    update(sim.id, updated);
    setMode("draft");
  }

  function handleSetDraft(draft: DraftState) {
    if (!sim) return;
    const updated: DraftSimulation = { ...sim, draft };
    update(sim.id, updated);
  }

  function handleSubmitResult(_winnerId: string) {
    setMode("list");
    setSimId(null);
  }

  function handleDelete(id: string) {
    remove(id);
    if (simId === id) {
      setSimId(null);
      setMode("list");
    }
  }

  function handleSavePresetSubmit() {
    if (!sim || !savePresetPlayer || !savePresetName.trim()) return;
    const reg =
      savePresetPlayer === "A"
        ? sim.playerARegistration
        : sim.playerBRegistration;
    if (reg.length === 0) return;
    savePreset(savePresetName.trim(), reg);
    setMode("list");
    setSimId(null);
    setSavePresetName("");
    setSavePresetPlayer(null);
  }

  const syntheticTournament = sim ? makeTournament(sim) : null;
  const syntheticMatch = sim ? makeMatch(sim.draft) : null;
  const syntheticPlayerA = sim
    ? makePlayer(PLAYER_A_ID, sim.playerAName, sim.playerARegistration, 0)
    : null;
  const syntheticPlayerB = sim
    ? makePlayer(PLAYER_B_ID, sim.playerBName, sim.playerBRegistration, 1)
    : null;

  const sorted = [...list].sort((a, b) => b.createdAt - a.createdAt);
  const sortedPresets = [...presets].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Draft Pick Simulator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plan team compositions with full draft simulation
          </p>
        </div>
        <Button
          onClick={() => setMode("names")}
          disabled={!roster}
        >
          <Plus className="size-4" />
          New Draft Pick
        </Button>
      </div>

      {rosterLoading && !roster ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading roster...
        </div>
      ) : rosterError && !roster ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <p className="text-sm text-destructive">
            Failed to load roster: {rosterError}
          </p>
          <Button variant="outline" onClick={refresh}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedPresets.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Library className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Saved Presets
                  </h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {sortedPresets.length}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sortedPresets.map((p) => (
                    <button
                      key={p.id}
                      className="flex items-center gap-1 rounded-lg border px-2 py-1.5 hover:border-primary transition-colors group"
                      onClick={() => {
                        if (p.characters.length === 0) return;
                        setNewNameA("");
                        setNewNameB("");
                        const id = save({
                          playerAName: "You",
                          playerBName: "Opponent",
                          playerARegistration: p.characters,
                          playerBRegistration: [],
                          draft: null,
                          costConfig: DEFAULT_COST_CONFIG,
                        });
                        setSimId(id);
                        setMode("preset-b");
                      }}
                      title={`Load ${p.name} as Player A`}
                    >
                      <span className="text-xs font-medium">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        ({p.characters.length})
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          removePreset(p.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            removePreset(p.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive ml-1 shrink-0 cursor-pointer"
                      >
                        <Trash2 className="size-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!loaded ? (
              <div className="text-center text-muted-foreground py-20">
                Loading...
              </div>
            ) : sorted.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Shield className="size-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-1">
                    No draft simulations yet
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a draft pick simulation to practice your team
                    composition.
                  </p>
                  <Button
                    onClick={() => setMode("names")}
                    disabled={!roster}
                  >
                    <Plus className="size-4" />
                    New Draft Pick
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {sorted.map((s) => (
                  <SimCard
                    key={s.id}
                    sim={s}
                    rosterMap={rosterMap}
                    onOpen={() => handleOpenSim(s.id)}
                    onDelete={() => handleDelete(s.id)}
                    onSavePreset={(player) => {
                      setSimId(s.id);
                      setSavePresetPlayer(player);
                      setSavePresetName("");
                      setMode(
                        player === "A" ? "save-preset-a" : "save-preset-b",
                      );
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      {/* Names dialog */}
      <Dialog
        open={mode === "names"}
        onOpenChange={(open) => {
          if (!open) setMode("list");
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Draft Pick</DialogTitle>
            <DialogDescription>
              Set the player names for this draft simulation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nameA">Your name</Label>
              <Input
                id="nameA"
                placeholder="You"
                value={newNameA}
                onChange={(e) => setNewNameA(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameB">Opponent name</Label>
              <Input
                id="nameB"
                placeholder="Opponent"
                value={newNameB}
                onChange={(e) => setNewNameB(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMode("list")}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              <Shield className="size-4" />
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preset picker for Player A */}
      <Dialog
        open={mode === "preset-a"}
        onOpenChange={(open) => {
          if (!open) {
            setMode("list");
            setSimId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Register {sim?.playerAName || "Player A"}</DialogTitle>
            <DialogDescription>
              Load a saved preset or create a new registration.
            </DialogDescription>
          </DialogHeader>
          {presets.length > 0 && (
            <div className="space-y-2">
              <Label>Load from preset</Label>
              <Select onValueChange={handleLoadPresetA}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a preset..." />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.characters.length} chars)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setMode("register-a")}
            >
              <Plus className="size-4" />
              Create Manually
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMode("list");
                setSimId(null);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preset picker for Player B */}
      <Dialog
        open={mode === "preset-b"}
        onOpenChange={(open) => {
          if (!open) {
            setMode("list");
            setSimId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Register {sim?.playerBName || "Player B"}</DialogTitle>
            <DialogDescription>
              Load a saved preset or create a new registration.
            </DialogDescription>
          </DialogHeader>
          {presets.length > 0 && (
            <div className="space-y-2">
              <Label>Load from preset</Label>
              <Select onValueChange={handleLoadPresetB}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a preset..." />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.characters.length} chars)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setMode("register-b")}
            >
              <Plus className="size-4" />
              Create Manually
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMode("list");
                setSimId(null);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save preset dialog */}
      <Dialog
        open={mode === "save-preset-a" || mode === "save-preset-b"}
        onOpenChange={(open) => {
          if (!open) {
            setMode("list");
            setSimId(null);
            setSavePresetPlayer(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save as Preset</DialogTitle>
            <DialogDescription>
              Save{" "}
              {savePresetPlayer === "A"
                ? sim?.playerAName
                : sim?.playerBName}
              &apos;s registered characters as a reusable preset.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="presetName">Preset name</Label>
            <Input
              id="presetName"
              placeholder="My preset..."
              value={savePresetName}
              onChange={(e) => setSavePresetName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMode("list");
                setSimId(null);
                setSavePresetPlayer(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePresetSubmit}
              disabled={!savePresetName.trim()}
            >
              <Library className="size-4" />
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {mode === "register-a" && sim && syntheticPlayerA && roster && (
        <RegistrationModal
          player={syntheticPlayerA}
          roster={roster}
          onSave={handleSaveRegistrationA}
          onOpenChange={(open) => {
            if (!open) {
              setMode("list");
              setSimId(null);
            }
          }}
        />
      )}

      {mode === "register-b" && sim && syntheticPlayerB && roster && (
        <RegistrationModal
          player={syntheticPlayerB}
          roster={roster}
          onSave={handleSaveRegistrationB}
          onOpenChange={(open) => {
            if (!open) {
              setMode("list");
              setSimId(null);
            }
          }}
        />
      )}

      {mode === "draft" && sim && syntheticMatch && syntheticTournament && (
        <DraftModal
          match={syntheticMatch}
          tournament={syntheticTournament}
          rosterMap={rosterMap}
          onSetDraft={handleSetDraft}
          onSubmitResult={handleSubmitResult}
          onOpenChange={(open) => {
            if (!open) {
              setMode("list");
              setSimId(null);
            }
          }}
        />
      )}
    </main>
  );
}

function SimCard({
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
  onSavePreset: (player: "A" | "B") => void;
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">{sim.playerAName}</span>
            <div className="flex items-center gap-1">
              {sim.playerARegistration.length > 0 && (
                <button
                  onClick={() => onSavePreset("A")}
                  className="text-muted-foreground hover:text-foreground"
                  title="Save as preset"
                >
                  <Download className="size-3" />
                </button>
              )}
              {teamA.length > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {costA}/{sim.costConfig.maxCost}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-0.5">
            {teamA.length === 0 &&
              sim.playerARegistration.slice(0, 6).map((r) => {
                const unit = rosterMap.get(r.unitId);
                return unit ? (
                  <UnitIcon key={r.unitId} unit={unit} size={24} />
                ) : null;
              })}
            {teamA.map((slot, i) => {
              const char = slot.charUnitId
                ? rosterMap.get(slot.charUnitId)
                : null;
              return char ? (
                <UnitIcon key={i} unit={char} size={24} />
              ) : null;
            })}
          </div>
        </div>

        <Separator />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">{sim.playerBName}</span>
            <div className="flex items-center gap-1">
              {sim.playerBRegistration.length > 0 && (
                <button
                  onClick={() => onSavePreset("B")}
                  className="text-muted-foreground hover:text-foreground"
                  title="Save as preset"
                >
                  <Download className="size-3" />
                </button>
              )}
              {teamB.length > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {costB}/{sim.costConfig.maxCost}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-0.5">
            {teamB.length === 0 &&
              sim.playerBRegistration.slice(0, 6).map((r) => {
                const unit = rosterMap.get(r.unitId);
                return unit ? (
                  <UnitIcon key={r.unitId} unit={unit} size={24} />
                ) : null;
              })}
            {teamB.map((slot, i) => {
              const char = slot.charUnitId
                ? rosterMap.get(slot.charUnitId)
                : null;
              return char ? (
                <UnitIcon key={i} unit={char} size={24} />
              ) : null;
            })}
          </div>
        </div>

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

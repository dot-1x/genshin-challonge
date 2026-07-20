"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  DraftSimulation,
  RegisteredChar,
} from "@/lib/types";
import { DEFAULT_COST_CONFIG } from "@/lib/types";
import { useSimulations } from "@/lib/simulator";
import { usePresets } from "@/lib/presets";
import { useRoster } from "@/lib/roster";
import { RegistrationModal } from "@/components/RegistrationModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Shield, Library } from "lucide-react";
import {
  makePlayer,
  playerReg,
  playerName,
  PLAYER_A_ID,
  PLAYER_B_ID,
  type PlayerSlot,
} from "./utils";
import { PresetPickerDialog } from "./PresetPickerDialog";
import { PresetChip } from "./PresetChip";
import { SimCard } from "./SimCard";

type Mode =
  | "list"
  | "names"
  | "preset"
  | "register"
  | "save-preset";

export function SimulatorView() {
  const { list, loaded, save, update, remove } = useSimulations();
  const {
    list: presets,
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
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("list");
  const [simId, setSimId] = useState<string | null>(null);
  const [activePlayer, setActivePlayer] = useState<PlayerSlot | null>(null);
  const [newNameA, setNewNameA] = useState("");
  const [newNameB, setNewNameB] = useState("");
  const [presetName, setPresetName] = useState("");

  function openDraft(id: string) {
    router.push(`/simulator/${id}`);
  }

  const sim = simId ? list.find((s) => s.id === simId) ?? null : null;

  function closeSim() {
    setMode("list");
    setSimId(null);
    setActivePlayer(null);
    setPresetName("");
  }

  function applyReg(
    player: PlayerSlot,
    reg: RegisteredChar[],
  ): DraftSimulation | null {
    if (!sim) return null;
    return player === "A"
      ? { ...sim, playerARegistration: reg }
      : { ...sim, playerBRegistration: reg };
  }

  function advanceAfterReg(player: PlayerSlot) {
    if (player === "A") {
      setActivePlayer("B");
      setMode("preset");
    } else {
      setActivePlayer(null);
      const currentSim = simId;
      if (currentSim) openDraft(currentSim);
    }
  }

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
    setActivePlayer("A");
    setMode("preset");
    setNewNameA("");
    setNewNameB("");
  }

  function handleOpenSim(id: string) {
    const s = list.find((x) => x.id === id);
    if (!s) return;
    setPresetName("");
    if (s.draft) {
      setActivePlayer(null);
      openDraft(id);
    } else if (
      s.playerARegistration.length + s.playerBRegistration.length ===
      0
    ) {
      setSimId(id);
      setActivePlayer("A");
      setMode("preset");
    } else if (s.playerBRegistration.length === 0) {
      setSimId(id);
      setActivePlayer("B");
      setMode("preset");
    } else {
      setActivePlayer(null);
      openDraft(id);
    }
  }

  function handlePickPreset(presetId: string | null) {
    if (!presetId || !sim || !activePlayer) return;
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    const next = applyReg(activePlayer, preset.characters);
    if (!next) return;
    update(sim.id, next);
    advanceAfterReg(activePlayer);
  }

  function handleSaveRegistration(reg: RegisteredChar[]) {
    if (!sim || !activePlayer) return;
    const next = applyReg(activePlayer, reg);
    if (!next) return;
    update(sim.id, next);
    advanceAfterReg(activePlayer);
  }

  function handleDelete(id: string) {
    remove(id);
    if (simId === id) closeSim();
  }

  function handleOpenSavePreset(player: PlayerSlot, simId: string) {
    setSimId(simId);
    setActivePlayer(player);
    setPresetName("");
    setMode("save-preset");
  }

  function handleSavePresetSubmit() {
    if (!sim || !activePlayer || !presetName.trim()) return;
    const reg = playerReg(sim, activePlayer);
    if (reg.length === 0) return;
    savePreset(presetName.trim(), reg);
    closeSim();
  }

  const sorted = [...list].sort((a, b) => b.createdAt - a.createdAt);
  const sortedPresets = [...presets].sort(
    (a, b) => b.createdAt - a.createdAt,
  );

  const activePlayerLabel = sim && activePlayer
    ? playerName(sim, activePlayer)
    : "";

  const syntheticPlayer = sim && activePlayer
    ? makePlayer(
        activePlayer === "A" ? PLAYER_A_ID : PLAYER_B_ID,
        playerName(sim, activePlayer),
        playerReg(sim, activePlayer),
        activePlayer === "A" ? 0 : 1,
      )
    : null;

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
                  <PresetChip
                    key={p.id}
                    preset={p}
                    onLoad={() => {
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
                      setActivePlayer("B");
                      setMode("preset");
                    }}
                    onDelete={() => removePreset(p.id)}
                  />
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
                  onSavePreset={(player) =>
                    handleOpenSavePreset(player, s.id)
                  }
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

      {/* Preset picker (active player) */}
      <PresetPickerDialog
        open={mode === "preset"}
        playerName={activePlayerLabel || "Player"}
        presets={presets}
        onPickPreset={handlePickPreset}
        onCreateManually={() => setMode("register")}
        onOpenChange={(open) => {
          if (!open) closeSim();
        }}
      />

      {/* Save preset dialog */}
      <Dialog
        open={mode === "save-preset"}
        onOpenChange={(open) => {
          if (!open) closeSim();
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save as Preset</DialogTitle>
            <DialogDescription>
              Save {activePlayerLabel}&apos;s registered characters as a
              reusable preset.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="presetName">Preset name</Label>
            <Input
              id="presetName"
              placeholder="My preset..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeSim}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePresetSubmit}
              disabled={!presetName.trim()}
            >
              <Library className="size-4" />
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {mode === "register" && sim && syntheticPlayer && roster && (
        <RegistrationModal
          player={syntheticPlayer}
          roster={roster}
          onSave={handleSaveRegistration}
          onOpenChange={(open) => {
            if (!open) closeSim();
          }}
        />
      )}
    </main>
  );
}
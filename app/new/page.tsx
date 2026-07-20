"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTournament } from "@/lib/store";
import type { CostConfig, CostRule, TournamentType, BracketType } from "@/lib/types";
import { COST_PRESETS } from "@/lib/types";
import { uid } from "@/lib/random";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const PLAYER_COUNTS = [2, 4, 8, 16, 32];

export default function NewTournamentPage() {
  const router = useRouter();
  const [name, setName] = useState("Genshin Challonge");
  const [format, setFormat] = useState<BracketType>("single");
  const [tournamentType, setTournamentType] = useState<TournamentType>("spiral");
  const [playerCount, setPlayerCount] = useState(8);
  const [maxCost, setMaxCost] = useState(7);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [limitedCharBase, setLimitedCharBase] = useState(1);
  const [perCons, setPerCons] = useState(1);
  const [limitedWeaponBase, setLimitedWeaponBase] = useState(1);
  const [perRefine, setPerRefine] = useState(1);
  const [charConsCosts, setCharConsCosts] = useState<{ [cons: number]: number } | undefined>(undefined);
  const [weaponRefineCosts, setWeaponRefineCosts] = useState<{ [refine: number]: number } | undefined>(undefined);
  const [selectedPreset, setSelectedPreset] = useState("default");
  const [customRules, setCustomRules] = useState<CostRule[]>([]);
  const [playerText, setPlayerText] = useState("");

  const playerNames = playerText
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const countValid = playerNames.length === playerCount;

  function addRule() {
    setCustomRules((r) => [
      ...r,
      {
        id: uid(),
        label: "",
        target: "all",
        op: "add",
        value: 1,
      },
    ]);
  }

  function applyPreset(presetId: string) {
    const preset = COST_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPreset(presetId);
    const c = preset.config;
    setMaxCost(c.maxCost);
    setLimitedCharBase(c.limitedCharBase);
    setPerCons(c.perCons);
    setLimitedWeaponBase(c.limitedWeaponBase);
    setPerRefine(c.perRefine);
    setCustomRules(c.customRules);
    setCharConsCosts(c.charConsCosts);
    setWeaponRefineCosts(c.weaponRefineCosts);
  }

  function updateRule(id: string, patch: Partial<CostRule>) {
    setCustomRules((r) =>
      r.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
    );
  }

  function removeRule(id: string) {
    setCustomRules((r) => r.filter((rule) => rule.id !== id));
  }

  function handleGenerate() {
    if (!countValid) {
      toast.error(
        `Expected ${playerCount} players, got ${playerNames.length}`,
      );
      return;
    }
    if (playerNames.length !== new Set(playerNames).size) {
      toast.error("Duplicate player names detected");
      return;
    }

    const costConfig: CostConfig = {
      maxCost,
      limitedCharBase,
      perCons,
      limitedWeaponBase,
      perRefine,
      customRules,
      charConsCosts,
      weaponRefineCosts,
    };

    const id = createTournament({
      name: name.trim() || "Untitled Tournament",
      format,
      type: tournamentType,
      playerCount,
      costConfig,
      playerNames,
    });
    toast.success("Tournament created!");
    router.push(`/t/${id}`);
  }

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
      <Button render={<Link href="/" />} variant="ghost" size="sm" className="mb-4">
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <h1 className="text-2xl font-bold tracking-tight mb-6">
        New Tournament
      </h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tournament Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Format</Label>
                <Select
                  value={format}
                  onValueChange={(v) => { if (v) setFormat(v as BracketType); }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Elimination</SelectItem>
                    <SelectItem value="double">Double Elimination</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tournament Type</Label>
                <Select
                  value={tournamentType}
                  onValueChange={(v) => { if (v) setTournamentType(v as TournamentType); }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spiral">Spiral Abyss (2 Halves)</SelectItem>
                    <SelectItem value="stygian">Stygian (3 Stages)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Player Count</Label>
                <Select
                  value={String(playerCount)}
                  onValueChange={(v) => { if (v) setPlayerCount(Number(v)); }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAYER_COUNTS.map((c) => (
                      <SelectItem key={c} value={String(c)}>
                        {c} players
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxCost">Maximum Cost</Label>
              <Input
                id="maxCost"
                type="number"
                min={1}
                value={maxCost}
                onChange={(e) => setMaxCost(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Limited 5★ char: base + per cons. Limited 5★ weapon: base + per
                refine. Standard: 0 cost.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Cost Preset</Label>
              <Select
                value={selectedPreset}
                onValueChange={(v) => { if (v) applyPreset(v); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COST_PRESETS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <button
              onClick={() => setShowAdvanced((s) => !s)}
              className="flex items-center justify-between w-full"
            >
              <div className="text-left">
                <CardTitle>Cost Configuration</CardTitle>
                <CardDescription>
                  Adjust cost coefficients and custom rules
                </CardDescription>
              </div>
              {showAdvanced ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
          </CardHeader>
          {showAdvanced && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="limitedCharBase">Limited Char Base</Label>
                  <Input
                    id="limitedCharBase"
                    type="number"
                    min={0}
                    value={limitedCharBase}
                    onChange={(e) => setLimitedCharBase(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perCons">Per Constellation</Label>
                  <Input
                    id="perCons"
                    type="number"
                    min={0}
                    value={perCons}
                    onChange={(e) => setPerCons(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="limitedWeaponBase">Limited Weapon Base</Label>
                  <Input
                    id="limitedWeaponBase"
                    type="number"
                    min={0}
                    value={limitedWeaponBase}
                    onChange={(e) =>
                      setLimitedWeaponBase(Number(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perRefine">Per Refine Level</Label>
                  <Input
                    id="perRefine"
                    type="number"
                    min={0}
                    value={perRefine}
                    onChange={(e) => setPerRefine(Number(e.target.value))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Custom Cost Rules</Label>
                  <Button variant="outline" size="xs" onClick={addRule}>
                    <Plus className="size-3" />
                    Add Rule
                  </Button>
                </div>
                {customRules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No custom rules. Add rules to adjust costs for specific
                    tournament variants.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {customRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center gap-2 flex-wrap"
                      >
                        <Input
                          placeholder="Label"
                          value={rule.label}
                          onChange={(e) =>
                            updateRule(rule.id, { label: e.target.value })
                          }
                          className="flex-1 min-w-32"
                        />
                        <Select
                          value={rule.target}
                          onValueChange={(v) => {
                            if (v) updateRule(rule.id, {
                              target: v as CostRule["target"],
                            });
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All units</SelectItem>
                            <SelectItem value="character">Characters</SelectItem>
                            <SelectItem value="weapon">Weapons</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={rule.op}
                          onValueChange={(v) => {
                            if (v) updateRule(rule.id, { op: v as CostRule["op"] });
                          }}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="add">+ Add</SelectItem>
                            <SelectItem value="sub">- Sub</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={rule.value}
                          onChange={(e) =>
                            updateRule(rule.id, { value: Number(e.target.value) })
                          }
                          className="w-20"
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeRule(rule.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Players</CardTitle>
            <CardDescription>
              Enter one player per line. Must be exactly {playerCount} players.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={playerText}
              onChange={(e) => setPlayerText(e.target.value)}
              placeholder={`Player 1\nPlayer 2\nPlayer 3\n...`}
              rows={Math.min(16, Math.max(6, playerCount))}
              className="font-mono text-sm"
            />
            <div className="flex items-center justify-between">
              <Badge variant={countValid ? "default" : "destructive"}>
                {playerNames.length} / {playerCount} players
              </Badge>
              <p className="text-xs text-muted-foreground">
                Opponents will be randomized on generate
              </p>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleGenerate}
          disabled={!countValid}
          className="w-full"
          size="lg"
        >
          Generate Bracket
        </Button>
      </div>
    </main>
  );
}

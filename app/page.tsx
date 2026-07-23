"use client";

import Link from "next/link";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useTournaments, importTournament } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Plus, Trash2, Swords, Upload } from "lucide-react";
import type { BracketType, TournamentType } from "@/lib/types";
import { toast } from "sonner";

function formatLabel(f: BracketType): string {
  return f === "double" ? "Double Elim" : "Single Elim";
}

function typeLabel(t: TournamentType): string {
  if (t === "spiral") return "Spiral Abyss";
  return "Stygian";
}

export default function Home() {
  const { list, loaded, remove } = useTournaments();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const sorted = [...list].sort((a, b) => b.createdAt - a.createdAt);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const id = await importTournament(file);
      toast.success("Tournament imported!");
      router.push(`/t/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    }
    e.target.value = "";
  }

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Genshin Challonge
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bracket history & draft pick system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImport}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" />
            Import
          </Button>
          <Button render={<Link href="/new" />}>
            <Plus className="size-4" />
            New Tournament
          </Button>
        </div>
      </div>

      {!loaded ? (
        <div className="text-center text-muted-foreground py-20">
          Loading...
        </div>
      ) : sorted.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Swords className="size-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">No tournaments yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first Genshin Challonge tournament bracket.
            </p>
            <Button render={<Link href="/new" />}>
              <Plus className="size-4" />
              Create Tournament
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((t) => {
            const champion = t.championId
              ? t.players.find((p) => p.id === t.championId)
              : null;
            const completed = t.matches.filter((m) => m.winnerId).length;
            const total = t.matches.length;
            return (
              <Card key={t.id} className="group relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate">{t.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {new Date(t.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </CardDescription>
                    </div>
                    <button
                      onClick={() => remove(t.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      aria-label="Delete tournament"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant="secondary">
                      {formatLabel(t.format)}
                    </Badge>
                    <Badge variant="secondary">
                      {typeLabel(t.type)}
                    </Badge>
                    <Badge variant="secondary">{t.playerCount} players</Badge>
                    <Badge variant="secondary">
                      Max cost {t.costConfig.maxCost}
                    </Badge>
                    {t.status === "complete" && (
                      <Badge variant="default">Complete</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {completed}/{total} matches
                    </span>
                    {champion && (
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <Trophy className="size-4 text-yellow-500" />
                        {champion.name}
                      </span>
                    )}
                  </div>
                  <Button
                    render={<Link href={`/t/${t.id}`} />}
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                  >
                    View Bracket
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  CostConfig,
  DraftState,
  Player,
  RegisteredChar,
  Tournament,
  TournamentType,
  BracketType,
} from "./types";
import { DEFAULT_COST_CONFIG } from "./types";
import { uid } from "./random";
import { generateBracket } from "./bracket";
import { applyResult } from "./advance";
import { createDraft } from "./draft";

const STORAGE_KEY = "gc_tournaments_v1";
const emitter = new EventTarget();

function loadAll(): Tournament[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? (JSON.parse(data) as Tournament[]) : [];
  } catch {
    return [];
  }
}

function saveAll(list: Tournament[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore quota errors
  }
  emitter.dispatchEvent(new Event("change"));
}

function updateTournament(id: string, fn: (t: Tournament) => Tournament) {
  const all = loadAll();
  saveAll(all.map((t) => (t.id === id ? fn(t) : t)));
}

export type CreateTournamentData = {
  name: string;
  format: BracketType;
  type: TournamentType;
  playerCount: number;
  costConfig: CostConfig;
  playerNames: string[];
  shufflePlayers: boolean;
};

export function createTournament(data: CreateTournamentData): string {
  const all = loadAll();
  const id = uid();
  const players: Player[] = data.playerNames.map((name, i) => ({
    id: uid(),
    name,
    seed: i,
    registration: [],
    locked: false,
  }));
  const matches = generateBracket(data.format, players, data.shufflePlayers);
  const tournament: Tournament = {
    id,
    name: data.name,
    format: data.format,
    type: data.type,
    playerCount: data.playerCount,
    costConfig: data.costConfig,
    players,
    matches,
    status: "knockout",
    championId: null,
    grandFinalReset: false,
    createdAt: Date.now(),
  };
  saveAll([...all, tournament]);
  return id;
}

export function deleteTournament(id: string) {
  const all = loadAll();
  saveAll(all.filter((t) => t.id !== id));
}

export function exportTournament(id: string) {
  const all = loadAll();
  const tournament = all.find((t) => t.id === id);
  if (!tournament) return;
  const json = JSON.stringify(tournament, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = tournament.name.replace(/[^a-z0-9-_]/gi, "_");
  a.download = `${safeName || "tournament"}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importTournament(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as Tournament;
        if (!parsed || typeof parsed !== "object") {
          reject(new Error("Invalid JSON format"));
          return;
        }
        if (!parsed.players || !parsed.matches || !parsed.id) {
          reject(new Error("Missing required tournament fields"));
          return;
        }
        const all = loadAll();
        const existing = all.some((t) => t.id === parsed.id);
        if (existing) {
          const newId = uid();
          const remapped = remapIds(parsed, newId);
          saveAll([...all, remapped]);
          resolve(newId);
        } else {
          saveAll([...all, parsed]);
          resolve(parsed.id);
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

function remapIds(t: Tournament, newId: string): Tournament {
  const idMap = new Map<string, string>();
  const newPlayers = t.players.map((p) => {
    const np = uid();
    idMap.set(p.id, np);
    return { ...p, id: np };
  });
  const newMatches = t.matches.map((m) => {
    const nm = uid();
    return {
      ...m,
      id: nm,
      playerAId: m.playerAId ? idMap.get(m.playerAId) ?? null : null,
      playerBId: m.playerBId ? idMap.get(m.playerBId) ?? null : null,
      winnerId: m.winnerId ? idMap.get(m.winnerId) ?? null : null,
    };
  });
  const matchIdMap = new Map<string, string>();
  t.matches.forEach((m, i) => matchIdMap.set(m.id, newMatches[i].id));
  const fixedMatches = newMatches.map((m) => ({
    ...m,
    feedsInto: m.feedsInto ? matchIdMap.get(m.feedsInto) ?? null : null,
    loserDropsTo: m.loserDropsTo ? matchIdMap.get(m.loserDropsTo) ?? null : null,
  }));
  const remappedDrafts = fixedMatches.map((m) => {
    if (!m.draft) return m;
    const d = m.draft;
    return {
      ...m,
      draft: {
        ...d,
        matchPlayerIds: [
          d.matchPlayerIds[0] ? idMap.get(d.matchPlayerIds[0]) ?? d.matchPlayerIds[0] : d.matchPlayerIds[0],
          d.matchPlayerIds[1] ? idMap.get(d.matchPlayerIds[1]) ?? d.matchPlayerIds[1] : d.matchPlayerIds[1],
        ] as [string, string],
        playerAId: d.playerAId ? idMap.get(d.playerAId) ?? null : null,
        playerBId: d.playerBId ? idMap.get(d.playerBId) ?? null : null,
        winnerId: d.winnerId ? idMap.get(d.winnerId) ?? null : null,
      },
    };
  });
  return {
    ...t,
    id: newId,
    players: newPlayers,
    matches: remappedDrafts,
    championId: t.championId ? idMap.get(t.championId) ?? null : null,
  };
}

export function updateRegistration(
  tournamentId: string,
  playerId: string,
  registration: RegisteredChar[],
) {
  updateTournament(tournamentId, (t) => ({
    ...t,
    players: t.players.map((p) => {
      if (p.id !== playerId || p.locked) return p;
      return { ...p, registration };
    }),
  }));
}

export function startDraft(tournamentId: string, matchId: string) {
  updateTournament(tournamentId, (t) => ({
    ...t,
    matches: t.matches.map((m) => {
      if (m.id !== matchId || m.draft) return m;
      if (!m.playerAId || !m.playerBId) return m;
      return { ...m, draft: createDraft([m.playerAId, m.playerBId]) };
    }),
  }));
}

export function updateDraft(
  tournamentId: string,
  matchId: string,
  draft: DraftState,
) {
  updateTournament(tournamentId, (t) => ({
    ...t,
    matches: t.matches.map((m) => (m.id === matchId ? { ...m, draft } : m)),
  }));
}

export function submitMatchResult(
  tournamentId: string,
  matchId: string,
  winnerId: string,
) {
  updateTournament(tournamentId, (t) => applyResult(t, matchId, winnerId));
}

export function useTournaments() {
  const [state, setState] = useState<{
    list: Tournament[];
    loaded: boolean;
  }>({ list: [], loaded: false });

  useEffect(() => {
    const handler = () => setState({ list: loadAll(), loaded: true });
    handler();
    emitter.addEventListener("change", handler);
    return () => emitter.removeEventListener("change", handler);
  }, []);

  const remove = useCallback((id: string) => deleteTournament(id), []);
  return { ...state, remove };
}

export function useTournament(id: string) {
  const [state, setState] = useState<{
    tournament: Tournament | null;
    loaded: boolean;
  }>({ tournament: null, loaded: false });

  useEffect(() => {
    const handler = () => {
      const all = loadAll();
      setState({
        tournament: all.find((t) => t.id === id) ?? null,
        loaded: true,
      });
    };
    handler();
    emitter.addEventListener("change", handler);
    return () => emitter.removeEventListener("change", handler);
  }, [id]);

  const setRegistration = useCallback(
    (playerId: string, registration: RegisteredChar[]) =>
      updateRegistration(id, playerId, registration),
    [id],
  );
  const beginDraft = useCallback(
    (matchId: string) => startDraft(id, matchId),
    [id],
  );
  const setDraft = useCallback(
    (matchId: string, draft: DraftState) => updateDraft(id, matchId, draft),
    [id],
  );
  const submitResult = useCallback(
    (matchId: string, winnerId: string) =>
      submitMatchResult(id, matchId, winnerId),
    [id],
  );
  const remove = useCallback(() => deleteTournament(id), [id]);

  return { ...state, setRegistration, beginDraft, setDraft, submitResult, remove };
}

export { DEFAULT_COST_CONFIG };

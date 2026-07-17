"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  CostConfig,
  DraftState,
  Player,
  RegisteredChar,
  Tournament,
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
  format: "single" | "double";
  playerCount: number;
  costConfig: CostConfig;
  playerNames: string[];
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
  const matches = generateBracket(data.format, players);
  const tournament: Tournament = {
    id,
    name: data.name,
    format: data.format,
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

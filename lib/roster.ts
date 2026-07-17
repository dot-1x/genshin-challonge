"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { STANDARD_CHARACTERS, STANDARD_WEAPONS } from "./standard";
import type { RosterUnit } from "./types";

const AVATAR_URL = "https://gi.yatta.moe/api/v2/en/avatar";
const WEAPON_URL = "https://gi.yatta.moe/api/v2/en/weapon";
const ICON_BASE = "https://gi.yatta.moe/assets/UI";
const CACHE_KEY = "gc_roster_v2";

type YattaItem = {
  id: number | string;
  rank: number;
  name: string;
  icon: string;
  route: string;
  element?: string;
  weaponType?: string;
  type?: string;
};

type RosterState = {
  roster: RosterUnit[] | null;
  loading: boolean;
  error: string | null;
};

let snapshot: RosterState = { roster: null, loading: false, error: null };
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

function setSnapshot(next: Partial<RosterState>) {
  snapshot = { ...snapshot, ...next };
  notify();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getSnapshot() {
  return snapshot;
}

async function fetchRoster(): Promise<RosterUnit[]> {
  const [avatarRes, weaponRes] = await Promise.all([
    fetch(AVATAR_URL, { headers: { "User-Agent": "genshin-challonge" } }),
    fetch(WEAPON_URL, { headers: { "User-Agent": "genshin-challonge" } }),
  ]);
  if (!avatarRes.ok || !weaponRes.ok) {
    throw new Error("Failed to fetch roster from Yatta API");
  }
  const avatarData = (await avatarRes.json()) as {
    data: { items: Record<string, YattaItem> };
  };
  const weaponData = (await weaponRes.json()) as {
    data: { items: Record<string, YattaItem> };
  };

  const units: RosterUnit[] = [];

  for (const item of Object.values(avatarData.data.items)) {
    if (item.rank !== 4 && item.rank !== 5) continue;
    units.push({
      id: `c-${item.id}`,
      kind: "character",
      name: item.name,
      rank: item.rank,
      element: item.element,
      weaponType: item.weaponType ?? "",
      icon: item.icon,
      iconUrl: `${ICON_BASE}/${item.icon}.png`,
      banner:
        item.rank === 4
          ? "standard"
          : STANDARD_CHARACTERS.has(item.name)
            ? "standard"
            : "limited",
      route: item.route,
    });
  }

  for (const item of Object.values(weaponData.data.items)) {
    if (item.rank !== 4 && item.rank !== 5) continue;
    units.push({
      id: `w-${item.id}`,
      kind: "weapon",
      name: item.name,
      rank: item.rank,
      weaponType: item.type ?? "",
      icon: item.icon,
      iconUrl: `${ICON_BASE}/${item.icon}.png`,
      banner:
        item.rank === 4
          ? "standard"
          : STANDARD_WEAPONS.has(item.name)
            ? "standard"
            : "limited",
      route: item.route,
    });
  }

  return units;
}

export function loadRoster(force = false) {
  if (snapshot.loading) return;
  if (snapshot.roster && !force) return;

  if (typeof window !== "undefined" && !force) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as RosterUnit[];
        setSnapshot({ roster: parsed, loading: false, error: null });
        return;
      }
    } catch {
      // ignore cache errors
    }
  }

  setSnapshot({ loading: true, error: null });
  fetchRoster()
    .then((units) => {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(units));
        } catch {
          // ignore quota errors
        }
      }
      setSnapshot({ roster: units, loading: false, error: null });
    })
    .catch((err: unknown) => {
      setSnapshot({
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    });
}

export type UseRosterResult = {
  roster: RosterUnit[] | null;
  rosterMap: Map<string, RosterUnit>;
  characters: RosterUnit[];
  weapons: RosterUnit[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

export function useRoster(): UseRosterResult {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    loadRoster();
  }, []);

  const rosterMap = useMemo(() => {
    const m = new Map<string, RosterUnit>();
    if (state.roster) {
      for (const u of state.roster) m.set(u.id, u);
    }
    return m;
  }, [state.roster]);

  const characters = useMemo(
    () =>
      state.roster
        ? state.roster.filter((u) => u.kind === "character")
        : [],
    [state.roster],
  );

  const weapons = useMemo(
    () => (state.roster ? state.roster.filter((u) => u.kind === "weapon") : []),
    [state.roster],
  );

  return {
    roster: state.roster,
    rosterMap,
    characters,
    weapons,
    loading: state.loading,
    error: state.error,
    refresh: () => loadRoster(true),
  };
}

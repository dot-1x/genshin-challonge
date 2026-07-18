"use client";

import { useCallback, useEffect, useState } from "react";
import type { DraftSimulation } from "./types";
import { uid } from "./random";

const STORAGE_KEY = "gc_simulations_v1";
const emitter = new EventTarget();

function loadAll(): DraftSimulation[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? (JSON.parse(data) as DraftSimulation[]) : [];
  } catch {
    return [];
  }
}

function saveAll(list: DraftSimulation[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore quota errors
  }
  emitter.dispatchEvent(new Event("change"));
}

export function saveSimulation(
  sim: Omit<DraftSimulation, "id" | "createdAt">,
): string {
  const all = loadAll();
  const id = uid();
  const record: DraftSimulation = { ...sim, id, createdAt: Date.now() };
  saveAll([...all, record]);
  return id;
}

export function updateSimulation(id: string, sim: DraftSimulation) {
  const all = loadAll();
  saveAll(all.map((s) => (s.id === id ? sim : s)));
}

export function deleteSimulation(id: string) {
  const all = loadAll();
  saveAll(all.filter((s) => s.id !== id));
}

export function useSimulations() {
  const [state, setState] = useState<{
    list: DraftSimulation[];
    loaded: boolean;
  }>({ list: [], loaded: false });

  useEffect(() => {
    const handler = () => setState({ list: loadAll(), loaded: true });
    handler();
    emitter.addEventListener("change", handler);
    return () => emitter.removeEventListener("change", handler);
  }, []);

  const save = useCallback(
    (sim: Omit<DraftSimulation, "id" | "createdAt">) => saveSimulation(sim),
    [],
  );
  const update = useCallback(
    (id: string, sim: DraftSimulation) => updateSimulation(id, sim),
    [],
  );
  const remove = useCallback((id: string) => deleteSimulation(id), []);

  return { ...state, save, update, remove };
}

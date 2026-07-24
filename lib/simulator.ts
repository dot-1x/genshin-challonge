"use client";

import { useCallback } from "react";
import type { DraftSimulation } from "./types";
import { uid } from "./random";
import { createListStore } from "./persisted-list";

const STORAGE_KEY = "gc_simulations_v1";

const { useStore, ensureHydrated, useHydrated } =
  createListStore<DraftSimulation>(STORAGE_KEY);

export function saveSimulation(
  sim: Omit<DraftSimulation, "id" | "createdAt">,
): string {
  ensureHydrated();
  const id = uid();
  const record: DraftSimulation = { ...sim, id, createdAt: Date.now() };
  useStore.getState().setList([...useStore.getState().list, record]);
  return id;
}

export function updateSimulation(id: string, sim: DraftSimulation) {
  ensureHydrated();
  useStore.getState().setList(useStore.getState().list.map((s) => (s.id === id ? sim : s)));
}

export function deleteSimulation(id: string) {
  ensureHydrated();
  useStore.getState().setList(useStore.getState().list.filter((s) => s.id !== id));
}

export function useSimulations() {
  const loaded = useHydrated();
  const list = useStore((s) => s.list);

  const save = useCallback(
    (sim: Omit<DraftSimulation, "id" | "createdAt">) => saveSimulation(sim),
    [],
  );
  const update = useCallback(
    (id: string, sim: DraftSimulation) => updateSimulation(id, sim),
    [],
  );
  const remove = useCallback((id: string) => deleteSimulation(id), []);

  return { list, loaded, save, update, remove };
}

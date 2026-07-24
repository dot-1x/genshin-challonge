"use client";

import { useCallback } from "react";
import type { RegistrationPreset } from "./types";
import { uid } from "./random";
import { createListStore } from "./persisted-list";

const STORAGE_KEY = "gc_reg_presets_v1";

const { useStore, ensureHydrated, useHydrated } =
  createListStore<RegistrationPreset>(STORAGE_KEY);

export function savePreset(
  name: string,
  characters: RegistrationPreset["characters"],
): string {
  ensureHydrated();
  const id = uid();
  const preset: RegistrationPreset = { id, name, characters, createdAt: Date.now() };
  useStore.getState().setList([...useStore.getState().list, preset]);
  return id;
}

export function deletePreset(id: string) {
  ensureHydrated();
  useStore.getState().setList(useStore.getState().list.filter((p) => p.id !== id));
}

export function usePresets() {
  const loaded = useHydrated();
  const list = useStore((s) => s.list);

  const save = useCallback(
    (name: string, characters: RegistrationPreset["characters"]) =>
      savePreset(name, characters),
    [],
  );
  const remove = useCallback((id: string) => deletePreset(id), []);

  return { list, loaded, save, remove };
}

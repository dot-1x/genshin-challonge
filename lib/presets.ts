"use client";

import { useCallback, useEffect, useState } from "react";
import type { RegistrationPreset } from "./types";
import { uid } from "./random";

const STORAGE_KEY = "gc_reg_presets_v1";
const emitter = new EventTarget();

function loadAll(): RegistrationPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? (JSON.parse(data) as RegistrationPreset[]) : [];
  } catch {
    return [];
  }
}

function saveAll(list: RegistrationPreset[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
  emitter.dispatchEvent(new Event("change"));
}

export function savePreset(
  name: string,
  characters: RegistrationPreset["characters"],
): string {
  const all = loadAll();
  const id = uid();
  const preset: RegistrationPreset = { id, name, characters, createdAt: Date.now() };
  saveAll([...all, preset]);
  return id;
}

export function deletePreset(id: string) {
  const all = loadAll();
  saveAll(all.filter((p) => p.id !== id));
}

export function usePresets() {
  const [state, setState] = useState<{
    list: RegistrationPreset[];
    loaded: boolean;
  }>({ list: [], loaded: false });

  useEffect(() => {
    const handler = () => setState({ list: loadAll(), loaded: true });
    handler();
    emitter.addEventListener("change", handler);
    return () => emitter.removeEventListener("change", handler);
  }, []);

  const save = useCallback(
    (name: string, characters: RegistrationPreset["characters"]) =>
      savePreset(name, characters),
    [],
  );
  const remove = useCallback((id: string) => deletePreset(id), []);

  return { ...state, save, remove };
}

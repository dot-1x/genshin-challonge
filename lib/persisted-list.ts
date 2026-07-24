"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";

/**
 * Shared factory for the app's localStorage-persisted list stores.
 *
 * - Keeps the legacy storage format (a raw JSON array under `key`) so
 *   existing user data stays intact.
 * - Hydration is explicit and synchronous (`ensureHydrated`) instead of
 *   zustand's async `rehydrate()`, so the first client render matches the
 *   server HTML (no hydration mismatch) and standalone mutations can never
 *   run against an unhydrated store.
 */
export function createListStore<T>(key: string) {
  function readRaw(): T[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(key);
      return data ? (JSON.parse(data) as T[]) : [];
    } catch {
      return [];
    }
  }

  const storage: PersistStorage<{ list: T[] }> = {
    getItem: () => {
      if (typeof window === "undefined") return null;
      try {
        const data = localStorage.getItem(key);
        if (!data) return null;
        return { state: { list: JSON.parse(data) as T[] } };
      } catch {
        return null;
      }
    },
    setItem: (_name, value) => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(key, JSON.stringify(value.state.list));
      } catch {
        // ignore quota errors
      }
    },
    removeItem: () => {
      if (typeof window === "undefined") return;
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    },
  };

  type ListState = {
    list: T[];
    hydrated: boolean;
    setList: (list: T[]) => void;
  };

  const useStore = create<ListState>()(
    persist(
      (set) => ({
        list: [],
        hydrated: false,
        setList: (list) => set({ list }),
      }),
      {
        name: key,
        storage,
        skipHydration: true,
        partialize: (state) => ({ list: state.list }),
      },
    ),
  );

  /** Synchronously load localStorage into memory. Idempotent. */
  function ensureHydrated() {
    if (!useStore.getState().hydrated) {
      useStore.setState({ list: readRaw(), hydrated: true });
    }
  }

  /** Hook: hydrates after mount (avoids SSR mismatch), returns `loaded`. */
  function useHydrated(): boolean {
    const hydrated = useStore((s) => s.hydrated);
    useEffect(() => {
      ensureHydrated();
    }, []);
    return hydrated;
  }

  return { useStore, ensureHydrated, useHydrated };
}

"use client";

import { useMemo } from "react";
import type { RosterUnit } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { UnitIcon } from "@/components/UnitIcon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export function elementLabel(e: string): string {
  return (
    {
      Ice: "Cryo",
      Fire: "Pyro",
      Water: "Hydro",
      Wind: "Anemo",
      Rock: "Geo",
      Grass: "Dendro",
      Electric: "Electro",
    }[e] ?? e
  );
}

export type PoolChar = {
  unit: RosterUnit;
  cons: number;
};

export type PoolFilter = "registered" | "all" | string;

export function CharacterPool({
  registeredPool,
  allPool,
  onSelect,
  disabledIds,
  disabledReason,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  height,
}: {
  registeredPool: PoolChar[];
  allPool: PoolChar[];
  onSelect: (item: PoolChar) => void;
  disabledIds?: Set<string>;
  disabledReason?: string;
  filter: PoolFilter;
  onFilterChange: (f: PoolFilter) => void;
  search?: string;
  onSearchChange?: (s: string) => void;
  height?: string;
}) {
  const elements = useMemo(() => {
    const s = new Set<string>();
    for (const p of allPool) {
      if (p.unit.element) s.add(p.unit.element);
    }
    return [...s].sort();
  }, [allPool]);

  const disabled = disabledIds ?? new Set<string>();

  const basePool = useMemo(() => {
    if (filter === "registered") return registeredPool;
    if (filter === "all") return allPool;
    return allPool.filter((p) => p.unit.element === filter);
  }, [filter, registeredPool, allPool]);

  const filtered = useMemo(() => {
    let list = basePool;
    const q = (search ?? "").toLowerCase().trim();
    if (q) list = list.filter((p) => p.unit.name.toLowerCase().includes(q));
    return list;
  }, [basePool, search]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => onFilterChange("registered")}
          className={cn(
            "text-xs px-2 py-0.5 rounded-full border transition-colors",
            filter === "registered"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border hover:border-primary",
          )}
        >
          Registered
        </button>
        <button
          onClick={() => onFilterChange("all")}
          className={cn(
            "text-xs px-2 py-0.5 rounded-full border transition-colors",
            filter === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border hover:border-primary",
          )}
        >
          All
        </button>
        {elements.map((el) => (
          <button
            key={el}
            onClick={() => onFilterChange(el)}
            className={cn(
              "text-xs px-2 py-0.5 rounded-full border transition-colors",
              filter === el
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:border-primary",
            )}
          >
            {elementLabel(el)}
          </button>
        ))}
      </div>

      {onSearchChange && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search characters..."
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      )}

      <ScrollArea className={height ?? "h-40"}>
        <div className="flex flex-wrap gap-1.5 pr-2">
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">
              No characters match this filter.
            </p>
          )}
          {filtered.map(({ unit, cons }) => {
            const isDisabled = disabled.has(unit.id);
            return (
              <button
                key={unit.id}
                onClick={() => !isDisabled && onSelect({ unit, cons })}
                disabled={isDisabled}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border p-1 transition-colors",
                  isDisabled
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:border-primary hover:bg-muted/50",
                )}
                title={
                  isDisabled
                    ? disabledReason ?? "Unavailable"
                    : `${unit.name} ${unit.banner === "limited" ? `C${cons}` : ""}`
                }
              >
                <UnitIcon unit={unit} size={28} />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-xs font-medium">{unit.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {unit.rank}★{" "}
                    {unit.element ? elementLabel(unit.element) : ""}
                    {unit.banner === "limited" &&
                      cons > 0 &&
                      ` C${cons}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

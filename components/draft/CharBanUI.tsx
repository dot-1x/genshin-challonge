"use client";

import { useState } from "react";
import type { DraftState, Player, RosterUnit } from "@/lib/types";
import {
  CharacterPool,
  type PoolChar,
  type PoolFilter,
} from "@/components/CharacterPool";
import { getAllCharsPool, getRegisteredPool } from "@/lib/draft";

export function CharBanUI({
  opponentPlayer,
  draft,
  rosterMap,
  onBan,
}: {
  opponentPlayer: Player;
  draft: DraftState;
  rosterMap: Map<string, RosterUnit>;
  onBan: (unitId: string) => void;
}) {
  const [filter, setFilter] = useState<PoolFilter>("registered");

  const allPool: PoolChar[] = getAllCharsPool(opponentPlayer, draft, rosterMap);
  const regPool = getRegisteredPool(opponentPlayer, draft, rosterMap);

  if (allPool.length === 0 && regPool.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground text-center py-4">
          No characters available to ban from {opponentPlayer.name}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Ban a character from {opponentPlayer.name}&apos;s pool:
      </p>
      <CharacterPool
        registeredPool={regPool}
        allPool={allPool}
        onSelect={(item) => onBan(item.unit.id)}
        filter={filter}
        onFilterChange={setFilter}
      />
    </div>
  );
}
import type { DraftState, Player, RosterUnit } from "@/lib/types";
import { UnitIcon } from "@/components/UnitIcon";
import { getBannableRegisteredChars } from "@/lib/draft";
import { Ban } from "lucide-react";

export function GlobalBanUI({
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
  const bannable = getBannableRegisteredChars(opponentPlayer, draft);

  if (bannable.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {opponentPlayer.name} has no registered limited characters to ban.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Ban a registered limited 5★ from {opponentPlayer.name}:
      </p>
      <div className="flex flex-wrap gap-2">
        {bannable.map((id) => {
          const unit = rosterMap.get(id);
          if (!unit) return null;
          return (
            <button
              key={id}
              onClick={() => onBan(id)}
              className="flex items-center gap-2 rounded-lg border p-1.5 hover:border-destructive hover:bg-destructive/5 transition-colors"
            >
              <UnitIcon unit={unit} size={32} />
              <span className="text-sm font-medium">{unit.name}</span>
              <Ban className="size-3.5 text-destructive" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
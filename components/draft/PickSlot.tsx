import type { FieldedSlot, RosterUnit, Tournament } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { UnitIcon } from "@/components/UnitIcon";
import { elementLabel } from "@/components/CharacterPool";
import { slotCost } from "@/lib/cost";
import { X } from "lucide-react";

export function PickSlot({
  idx,
  slot,
  rosterMap,
  costConfig,
  onClear,
}: {
  idx: number;
  slot: FieldedSlot;
  rosterMap: Map<string, RosterUnit>;
  costConfig: Tournament["costConfig"];
  onClear: (idx: number) => void;
}) {
  const charUnit = slot.charUnitId ? rosterMap.get(slot.charUnitId) : null;
  const sc = slotCost(slot, rosterMap, costConfig);
  return (
    <div className="rounded-lg border p-2 space-y-2">
      <div className="flex items-center gap-2">
        {charUnit ? (
          <>
            <UnitIcon unit={charUnit} size={32} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {charUnit.name}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {charUnit.rank}★ {elementLabel(charUnit.element ?? "")}
                {charUnit.banner === "limited" && ` C${slot.charCons}`}
              </div>
            </div>
            <Badge variant="outline" className="text-xs">{sc}</Badge>
            <button
              onClick={() => onClear(idx)}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="size-3.5" />
            </button>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">
            Slot {idx + 1} — select a char
          </span>
        )}
      </div>
    </div>
  );
}
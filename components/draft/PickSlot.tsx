import type { FieldedSlot, RosterUnit, Tournament } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UnitIcon } from "@/components/UnitIcon";
import { elementLabel } from "@/components/CharacterPool";
import { slotCost } from "@/lib/cost";
import { getAvailableWeapons } from "@/lib/draft";
import { X } from "lucide-react";

export function PickSlot({
  idx,
  slot,
  rosterMap,
  costConfig,
  onClear,
  onSelectWeapon,
  onSetRefine,
}: {
  idx: number;
  slot: FieldedSlot;
  rosterMap: Map<string, RosterUnit>;
  costConfig: Tournament["costConfig"];
  onClear: (idx: number) => void;
  onSelectWeapon: (idx: number, weaponId: string) => void;
  onSetRefine: (idx: number, refine: number) => void;
}) {
  const charUnit = slot.charUnitId ? rosterMap.get(slot.charUnitId) : null;
  const availableWeapons = charUnit
    ? getAvailableWeapons(charUnit, rosterMap)
    : [];
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
      {charUnit && (
        <div className="flex items-center gap-1.5">
          <Select
            value={slot.weaponUnitId ?? ""}
            onValueChange={(v) => { if (v) onSelectWeapon(idx, v); }}
          >
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue placeholder="Weapon" />
            </SelectTrigger>
            <SelectContent>
              {availableWeapons.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.rank}★ {w.name} {w.banner === "limited" ? "(Limited)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(slot.refine)}
            onValueChange={(v) => { if (v) onSetRefine(idx, Number(v)); }}
            disabled={!slot.weaponUnitId}
          >
            <SelectTrigger className="h-7 w-14 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((r) => (
                <SelectItem key={r} value={String(r)}>
                  R{r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
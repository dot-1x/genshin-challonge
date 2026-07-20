import type { RegisteredChar, RosterUnit } from "@/lib/types";
import { UnitIcon } from "@/components/UnitIcon";
import { Download } from "lucide-react";

export function SimCardTeamRow({
  name,
  registration,
  team,
  cost,
  maxCost,
  rosterMap,
  onSavePreset,
}: {
  name: string;
  registration: RegisteredChar[];
  team: { charUnitId: string | null }[];
  cost: number;
  maxCost: number;
  rosterMap: Map<string, RosterUnit>;
  onSavePreset: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{name}</span>
        <div className="flex items-center gap-1">
          {registration.length > 0 && (
            <button
              onClick={onSavePreset}
              className="text-muted-foreground hover:text-foreground"
              title="Save as preset"
            >
              <Download className="size-3" />
            </button>
          )}
          {team.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {cost}/{maxCost}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-0.5">
        {team.length === 0 &&
          registration.slice(0, 6).map((r) => {
            const unit = rosterMap.get(r.unitId);
            return unit ? (
              <UnitIcon key={r.unitId} unit={unit} size={24} />
            ) : null;
          })}
        {team.map((slot, i) => {
          const char = slot.charUnitId
            ? rosterMap.get(slot.charUnitId)
            : null;
          return char ? (
            <UnitIcon key={i} unit={char} size={24} />
          ) : null;
        })}
      </div>
    </div>
  );
}
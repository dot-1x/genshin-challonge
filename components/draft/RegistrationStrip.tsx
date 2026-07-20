import type { Player, RosterUnit } from "@/lib/types";
import { UnitIcon } from "@/components/UnitIcon";
import { cn } from "@/lib/utils";

export function RegistrationStrip({
  player,
  rosterMap,
  isActorA,
  isActorTurn,
}: {
  player: Player;
  rosterMap: Map<string, RosterUnit>;
  isActorA: boolean;
  isActorTurn: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-2",
        isActorTurn && "border-primary bg-primary/5",
      )}
    >
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <span className="text-muted-foreground">{isActorA ? "A" : "B"}</span>
        <span>—</span>
        <span>{player.name}</span>
        {isActorTurn && (
          <span className="text-xs text-primary font-normal">Turn</span>
        )}
      </div>
      {player.registration.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No registered limited 5★.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {player.registration.map((reg) => {
            const unit = rosterMap.get(reg.unitId);
            if (!unit) return null;
            return (
              <div key={reg.unitId} className="relative">
                <UnitIcon unit={unit} size={36} />
                <span className="absolute bottom-0 right-0 bg-background/90 text-[10px] px-0.5 rounded-tl leading-none py-0.5 border border-t border-l border-border">
                  C{reg.cons}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
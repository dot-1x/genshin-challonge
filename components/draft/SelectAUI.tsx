import type { Player } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function SelectAUI({
  matchPlayers,
  onSelect,
}: {
  matchPlayers: [Player, Player];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Choose which player acts first (Player A):
      </p>
      <div className="grid grid-cols-2 gap-4">
        {matchPlayers.map((p) => (
          <Button
            key={p.id}
            variant="outline"
            size="lg"
            onClick={() => onSelect(p.id)}
            className="h-auto py-4"
          >
            <span className="font-bold text-lg">{p.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
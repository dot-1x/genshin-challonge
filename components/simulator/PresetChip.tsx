import type { RegistrationPreset } from "@/lib/types";
import { Trash2 } from "lucide-react";

export function PresetChip({
  preset,
  onLoad,
  onDelete,
}: {
  preset: RegistrationPreset;
  onLoad: () => void;
  onDelete: () => void;
}) {
  return (
    <button
      className="flex items-center gap-1 rounded-lg border px-2 py-1.5 hover:border-primary transition-colors group"
      onClick={onLoad}
      title={`Load ${preset.name} as Player A`}
    >
      <span className="text-xs font-medium">{preset.name}</span>
      <span className="text-[10px] text-muted-foreground">
        ({preset.characters.length})
      </span>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            onDelete();
          }
        }}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive ml-1 shrink-0 cursor-pointer"
      >
        <Trash2 className="size-3" />
      </span>
    </button>
  );
}
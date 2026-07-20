import { cn } from "@/lib/utils";

export function StageSwitcher({
  currentStageIndex,
  complete,
  viewStage,
  stageNames,
  onSelect,
}: {
  currentStageIndex: number;
  complete: boolean;
  viewStage: number;
  stageNames: string[];
  onSelect: (stage: number) => void;
}) {
  const count = currentStageIndex + (complete ? 1 : 0);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Array.from({ length: count }, (_, i) => {
        const isCurrent = i === currentStageIndex;
        const label = stageNames[i] ?? `Stage ${i + 1}`;
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={cn(
              "text-xs px-2 py-1 rounded-full border transition-colors",
              viewStage === i
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:border-primary text-muted-foreground",
            )}
          >
            {label}
            {!isCurrent && i < currentStageIndex && " ✓"}
            {isCurrent && " ←"}
          </button>
        );
      })}
    </div>
  );
}
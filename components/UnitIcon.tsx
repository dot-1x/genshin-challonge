import Image from "next/image";
import type { RosterUnit } from "@/lib/types";
import { cn } from "@/lib/utils";

export function UnitIcon({
  unit,
  size = 40,
  className,
}: {
  unit: RosterUnit;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={unit.iconUrl}
      alt={unit.name}
      width={size}
      height={size}
      className={cn("rounded-lg bg-muted object-cover", className)}
      unoptimized
    />
  );
}

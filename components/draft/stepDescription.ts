import type { Player } from "@/lib/types";

export function getStepDescription(
  type: string,
  actor: string | null,
  actorPlayer: Player | null,
  opponentPlayer: Player | null,
  stageName?: string,
): string {
  const actorName = actorPlayer?.name ?? "?";
  const oppName = opponentPlayer?.name ?? "?";
  const stage = stageName ? ` [${stageName}]` : "";
  switch (type) {
    case "select-a":
      return "Select Player A (acts first in the draft)";
    case "global-ban":
      return `${actorName} — Global Ban: ban 1 registered limited 5★ char from ${oppName}`;
    case "char-ban":
      return `${actorName} — Char Ban: ban 1 char from ${oppName}'s fieldable pool${stage}`;
    case "pick":
      return `${actorName} — Pick 2 characters + equip weapons${stage}`;
    default:
      return "";
  }
}
import type { CostConfig, CostRule, FieldedSlot, RosterUnit } from "./types";

function ruleModifier(
  rules: CostRule[],
  target: "character" | "weapon",
): number {
  return rules
    .filter((r) => r.target === target || r.target === "all")
    .reduce((sum, r) => sum + (r.op === "add" ? r.value : -r.value), 0);
}

function tieredCost(
  level: number,
  tiers: { [key: number]: number } | undefined,
  perLevel: number = 1,
): number | undefined {
  if (!tiers) return undefined;
  const keys = Object.keys(tiers).map(Number).sort((a, b) => a - b);
  if (keys.length === 0) return undefined;
  if (level in tiers) return tiers[level];
  const maxKey = keys[keys.length - 1];
  if (level > maxKey) return tiers[maxKey] + perLevel * (level - maxKey);
  const minKey = keys[0];
  if (level < minKey) return tiers[minKey] - perLevel * (minKey - level);
  for (let i = keys.length - 1; i >= 0; i--) {
    if (keys[i] < level) return tiers[keys[i]] + perLevel * (level - keys[i]);
  }
  return undefined;
}

export function charCost(
  unit: RosterUnit | undefined,
  cons: number,
  config: CostConfig,
): number {
  if (!unit || unit.kind !== "character") return 0;
  let cost = 0;
  if (unit.banner === "limited") {
    cost = tieredCost(cons, config.charConsCosts, config.perCons)
      ?? config.limitedCharBase + config.perCons * cons;
  }
  cost += ruleModifier(config.customRules, "character");
  return Math.max(0, cost);
}

export function weaponCost(
  unit: RosterUnit | undefined,
  refine: number,
  config: CostConfig,
): number {
  if (!unit || unit.kind !== "weapon") return 0;
  let cost = 0;
  if (unit.banner === "limited") {
    cost = tieredCost(refine, config.weaponRefineCosts, config.perRefine)
      ?? config.limitedWeaponBase + config.perRefine * (refine - 1);
  }
  cost += ruleModifier(config.customRules, "weapon");
  return Math.max(0, cost);
}

export function pairCost(
  charUnit: RosterUnit | undefined,
  cons: number,
  weaponUnit: RosterUnit | undefined,
  refine: number,
  config: CostConfig,
): number {
  return (
    charCost(charUnit, cons, config) + weaponCost(weaponUnit, refine, config)
  );
}

export function slotCost(
  slot: FieldedSlot,
  roster: Map<string, RosterUnit>,
  config: CostConfig,
): number {
  const charUnit = slot.charUnitId ? roster.get(slot.charUnitId) : undefined;
  const weaponUnit = slot.weaponUnitId
    ? roster.get(slot.weaponUnitId)
    : undefined;
  return pairCost(charUnit, slot.charCons, weaponUnit, slot.refine, config);
}

export function teamCost(
  slots: FieldedSlot[],
  roster: Map<string, RosterUnit>,
  config: CostConfig,
): number {
  return slots.reduce(
    (sum, slot) => sum + slotCost(slot, roster, config),
    0,
  );
}

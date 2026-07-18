import type {
  DraftState,
  FieldedSlot,
  Player,
  RosterUnit,
} from "./types";

export type DraftStep = {
  type: "select-a" | "global-ban" | "char-ban" | "pick";
  actor: "A" | "B" | null;
  count: number;
};

export const DRAFT_STEPS: DraftStep[] = [
  { type: "select-a", actor: null, count: 0 },
  { type: "global-ban", actor: "A", count: 1 },
  { type: "global-ban", actor: "B", count: 1 },
  { type: "char-ban", actor: "A", count: 1 },
  { type: "char-ban", actor: "B", count: 1 },
  { type: "pick", actor: "A", count: 2 },
  { type: "pick", actor: "B", count: 2 },
  { type: "char-ban", actor: "B", count: 1 },
  { type: "char-ban", actor: "A", count: 1 },
  { type: "pick", actor: "B", count: 2 },
  { type: "pick", actor: "A", count: 2 },
];

export const TOTAL_STEPS = DRAFT_STEPS.length;

function clone<T>(t: T): T {
  return JSON.parse(JSON.stringify(t)) as T;
}

export function createDraft(matchPlayerIds: [string, string]): DraftState {
  return {
    matchPlayerIds,
    playerAId: null,
    playerBId: null,
    stepIndex: 0,
    globalBans: { [matchPlayerIds[0]]: [], [matchPlayerIds[1]]: [] },
    charBans: { [matchPlayerIds[0]]: [], [matchPlayerIds[1]]: [] },
    fielded: { [matchPlayerIds[0]]: [], [matchPlayerIds[1]]: [] },
    winnerId: null,
  };
}

export function getCurrentStep(state: DraftState): DraftStep {
  return DRAFT_STEPS[Math.min(state.stepIndex, DRAFT_STEPS.length - 1)];
}

export function isDraftComplete(state: DraftState): boolean {
  return state.stepIndex >= DRAFT_STEPS.length;
}

export function getActorPlayerId(
  state: DraftState,
  actor: "A" | "B",
): string | null {
  return actor === "A" ? state.playerAId : state.playerBId;
}

export function getOpponentPlayerId(
  state: DraftState,
  actor: "A" | "B",
): string | null {
  return actor === "A" ? state.playerBId : state.playerAId;
}

export function selectActorA(state: DraftState, actorAId: string): DraftState {
  const next = clone(state);
  next.playerAId = actorAId;
  next.playerBId = next.matchPlayerIds.find((id) => id !== actorAId) ?? null;
  next.stepIndex++;
  return next;
}

export function applyGlobalBan(
  state: DraftState,
  charUnitId: string,
): DraftState {
  const step = getCurrentStep(state);
  if (step.type !== "global-ban" || !step.actor) return state;
  const opponentId = getOpponentPlayerId(state, step.actor);
  if (!opponentId) return state;
  const next = clone(state);
  next.globalBans[opponentId] = [
    ...(next.globalBans[opponentId] ?? []),
    charUnitId,
  ];
  next.stepIndex++;
  return next;
}

export function applyCharBan(
  state: DraftState,
  charUnitId: string,
): DraftState {
  const step = getCurrentStep(state);
  if (step.type !== "char-ban" || !step.actor) return state;
  const opponentId = getOpponentPlayerId(state, step.actor);
  if (!opponentId) return state;
  const next = clone(state);
  next.charBans[opponentId] = [
    ...(next.charBans[opponentId] ?? []),
    charUnitId,
  ];
  next.stepIndex++;
  return next;
}

export function applyPick(
  state: DraftState,
  slots: FieldedSlot[],
): DraftState {
  const step = getCurrentStep(state);
  if (step.type !== "pick" || !step.actor) return state;
  const actorId = getActorPlayerId(state, step.actor);
  if (!actorId) return state;
  const next = clone(state);
  next.fielded[actorId] = [...(next.fielded[actorId] ?? []), ...slots];
  next.stepIndex++;
  return next;
}

export function getBannableRegisteredChars(
  targetPlayer: Player,
  state: DraftState,
): string[] {
  const alreadyBanned = new Set(state.globalBans[targetPlayer.id] ?? []);
  return targetPlayer.registration
    .filter((reg) => !alreadyBanned.has(reg.unitId))
    .map((reg) => reg.unitId);
}

export function getFieldablePool(
  player: Player,
  state: DraftState,
  roster: Map<string, RosterUnit>,
): { unit: RosterUnit; cons: number }[] {
  const playerId = player.id;
  const globallyBanned = new Set(state.globalBans[playerId] ?? []);
  const charBanned = new Set(state.charBans[playerId] ?? []);
  const fielded = new Set(
    (state.fielded[playerId] ?? [])
      .filter((s) => s.charUnitId)
      .map((s) => s.charUnitId!),
  );
  const pool: { unit: RosterUnit; cons: number }[] = [];

  for (const reg of player.registration) {
    if (globallyBanned.has(reg.unitId)) continue;
    if (charBanned.has(reg.unitId)) continue;
    if (fielded.has(reg.unitId)) continue;
    const unit = roster.get(reg.unitId);
    if (unit) pool.push({ unit, cons: reg.cons });
  }

  for (const unit of roster.values()) {
    if (unit.kind !== "character" || unit.banner !== "standard") continue;
    if (charBanned.has(unit.id)) continue;
    if (fielded.has(unit.id)) continue;
    pool.push({ unit, cons: 0 });
  }

  return pool;
}

export function getRegisteredPool(
  player: Player,
  state: DraftState,
  roster: Map<string, RosterUnit>,
): { unit: RosterUnit; cons: number }[] {
  const playerId = player.id;
  const globallyBanned = new Set(state.globalBans[playerId] ?? []);
  const charBanned = new Set(state.charBans[playerId] ?? []);
  const fielded = new Set(
    (state.fielded[playerId] ?? [])
      .filter((s) => s.charUnitId)
      .map((s) => s.charUnitId!),
  );
  const pool: { unit: RosterUnit; cons: number }[] = [];
  for (const reg of player.registration) {
    if (globallyBanned.has(reg.unitId)) continue;
    if (charBanned.has(reg.unitId)) continue;
    if (fielded.has(reg.unitId)) continue;
    const unit = roster.get(reg.unitId);
    if (unit) pool.push({ unit, cons: reg.cons });
  }
  return pool;
}

export function getBannableFieldablePool(
  targetPlayer: Player,
  state: DraftState,
  roster: Map<string, RosterUnit>,
): RosterUnit[] {
  return getFieldablePool(targetPlayer, state, roster).map((p) => p.unit);
}

export function getAvailableWeapons(
  charUnit: RosterUnit,
  roster: Map<string, RosterUnit>,
): RosterUnit[] {
  return [...roster.values()].filter(
    (u) => u.kind === "weapon" && u.weaponType === charUnit.weaponType,
  );
}

export function getConsForChar(
  unitId: string,
  player: Player,
  roster: Map<string, RosterUnit>,
): number {
  const unit = roster.get(unitId);
  if (!unit || unit.banner === "standard") return 0;
  const reg = player.registration.find((r) => r.unitId === unitId);
  return reg?.cons ?? 0;
}

export function emptySlot(): FieldedSlot {
  return {
    charUnitId: null,
    charCons: 0,
    weaponUnitId: null,
    refine: 1,
  };
}

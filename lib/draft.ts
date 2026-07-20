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

const PRE_STEPS: DraftStep[] = [
  { type: "select-a", actor: null, count: 0 },
  { type: "global-ban", actor: "A", count: 1 },
  { type: "global-ban", actor: "B", count: 1 },
];

const PRE_COUNT = PRE_STEPS.length;

const PER_STAGE_STEPS: DraftStep[] = [
  { type: "char-ban", actor: "A", count: 1 },
  { type: "char-ban", actor: "B", count: 1 },
  { type: "pick", actor: "A", count: 2 },
  { type: "pick", actor: "B", count: 2 },
  { type: "char-ban", actor: "B", count: 1 },
  { type: "char-ban", actor: "A", count: 1 },
  { type: "pick", actor: "B", count: 2 },
  { type: "pick", actor: "A", count: 2 },
];

export const PER_STAGE_COUNT = PER_STAGE_STEPS.length;
const SLOTS_PER_STAGE = 4;

function clone<T>(t: T): T {
  return JSON.parse(JSON.stringify(t)) as T;
}

function swapActor(step: DraftStep): DraftStep {
  if (step.actor === "A") return { ...step, actor: "B" };
  if (step.actor === "B") return { ...step, actor: "A" };
  return step;
}

function buildSteps(stageCount: number): DraftStep[] {
  if (stageCount <= 1) return DRAFT_STEPS;
  const steps = [...PRE_STEPS];
  for (let i = 0; i < stageCount; i++) {
    if (i % 2 === 0) {
      steps.push(...PER_STAGE_STEPS);
    } else {
      steps.push(...PER_STAGE_STEPS.map(swapActor));
    }
  }
  return steps;
}

export function getStageCount(type: string): number {
  if (type === "spiral") return 2;
  if (type === "stygian") return 3;
  return 1;
}

export function getStageNames(stageCount: number): string[] {
  if (stageCount === 2) return ["1st Half", "2nd Half"];
  if (stageCount === 3) return ["Stage 1", "Stage 2", "Stage 3"];
  return ["Draft"];
}

export function getTotalSteps(stageCount: number): number {
  if (stageCount <= 1) return TOTAL_STEPS;
  return PRE_COUNT + PER_STAGE_COUNT * stageCount;
}

export function getStageForStep(stepIndex: number, stageCount: number = 1): number {
  if (stageCount <= 1) return 0;
  if (stepIndex < PRE_COUNT) return 0;
  return Math.floor((stepIndex - PRE_COUNT) / PER_STAGE_COUNT);
}

export function createDraft(matchPlayerIds: [string, string]): DraftState {
  return {
    matchPlayerIds,
    playerAId: null,
    playerBId: null,
    stepIndex: 0,
    globalBans: {
      [matchPlayerIds[0]]: [],
      [matchPlayerIds[1]]: [],
    },
    charBans: {
      [matchPlayerIds[0]]: [],
      [matchPlayerIds[1]]: [],
    },
    fielded: {
      [matchPlayerIds[0]]: [],
      [matchPlayerIds[1]]: [],
    },
    stageIndex: 0,
    stages: [],
    winnerId: null,
  };
}

export function getCurrentStep(
  state: DraftState,
  stageCount: number = 1,
): DraftStep {
  const steps = buildSteps(stageCount);
  return steps[Math.min(state.stepIndex, steps.length - 1)];
}

export function isDraftComplete(
  state: DraftState,
  stageCount: number = 1,
): boolean {
  return state.stepIndex >= getTotalSteps(stageCount);
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

function transitionStageIfNeeded(
  state: DraftState,
  stageCount: number,
): DraftState {
  if (stageCount <= 1) return clone(state);
  const nextStage = getStageForStep(state.stepIndex, stageCount);
  const next = clone(state);
  if (nextStage !== next.stageIndex) {
    next.stages = [
      ...next.stages,
      {
        charBans: clone(next.charBans),
        fielded: clone(next.fielded),
      },
    ];
    next.charBans = {};
    for (const pid of next.matchPlayerIds) {
      next.charBans[pid] = [];
    }
    next.stageIndex = nextStage;
  }
  return next;
}

function advanceStageIfCrossed(
  next: DraftState,
  stageCount: number,
): DraftState {
  if (stageCount <= 1) return next;
  const newStage = getStageForStep(next.stepIndex, stageCount);
  if (newStage === next.stageIndex) return next;
  next.stages = [
    ...next.stages,
    {
      charBans: clone(next.charBans),
      fielded: clone(next.fielded),
    },
  ];
  next.charBans = {};
  for (const pid of next.matchPlayerIds) {
    next.charBans[pid] = [];
  }
  next.stageIndex = newStage;
  return next;
}

export function getStageFielded(
  state: DraftState,
  playerId: string,
): FieldedSlot[] {
  const all = state.fielded[playerId] ?? [];
  const start = state.stageIndex * SLOTS_PER_STAGE;
  return all.slice(start, start + SLOTS_PER_STAGE);
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
  stageCount: number = 1,
): DraftState {
  const step = getCurrentStep(state, stageCount);
  if (step.type !== "char-ban" || !step.actor) return state;
  const opponentId = getOpponentPlayerId(state, step.actor);
  if (!opponentId) return state;
  const next = transitionStageIfNeeded(state, stageCount);
  next.charBans[opponentId] = [
    ...(next.charBans[opponentId] ?? []),
    charUnitId,
  ];
  next.stepIndex++;
  return advanceStageIfCrossed(next, stageCount);
}

export function applyPick(
  state: DraftState,
  slots: FieldedSlot[],
  stageCount: number = 1,
): DraftState {
  const step = getCurrentStep(state, stageCount);
  if (step.type !== "pick" || !step.actor) return state;
  const actorId = getActorPlayerId(state, step.actor);
  if (!actorId) return state;
  const next = transitionStageIfNeeded(state, stageCount);
  next.fielded[actorId] = [...(next.fielded[actorId] ?? []), ...slots];
  next.stepIndex++;
  return advanceStageIfCrossed(next, stageCount);
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

export function getAllCharsPool(
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
  const registeredCons = new Map(
    player.registration.map((reg) => [reg.unitId, reg.cons]),
  );
  const pool: { unit: RosterUnit; cons: number }[] = [];
  for (const unit of roster.values()) {
    if (unit.kind !== "character") continue;
    if (unit.banner === "limited" && !registeredCons.has(unit.id)) continue;
    if (globallyBanned.has(unit.id)) continue;
    if (charBanned.has(unit.id)) continue;
    if (fielded.has(unit.id)) continue;
    pool.push({ unit, cons: registeredCons.get(unit.id) ?? 0 });
  }
  return pool;
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

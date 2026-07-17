export type UnitKind = "character" | "weapon";
export type Banner = "limited" | "standard";

export type RosterUnit = {
  id: string;
  kind: UnitKind;
  name: string;
  rank: number;
  element?: string;
  weaponType: string;
  icon: string;
  iconUrl: string;
  banner: Banner;
  route: string;
};

export type RegisteredChar = {
  unitId: string;
  cons: number;
};

export type Player = {
  id: string;
  name: string;
  seed: number;
  registration: RegisteredChar[];
  locked: boolean;
};

export type CostRule = {
  id: string;
  label: string;
  target: "character" | "weapon" | "all";
  op: "add" | "sub";
  value: number;
};

export type CostConfig = {
  maxCost: number;
  limitedCharBase: number;
  perCons: number;
  limitedWeaponBase: number;
  perRefine: number;
  customRules: CostRule[];
};

export type FieldedSlot = {
  charUnitId: string | null;
  charCons: number;
  weaponUnitId: string | null;
  refine: number;
};

export type DraftStepType = "select-a" | "global-ban" | "char-ban" | "pick";

export type DraftState = {
  matchPlayerIds: [string, string];
  playerAId: string | null;
  playerBId: string | null;
  stepIndex: number;
  globalBans: Record<string, string[]>;
  charBans: Record<string, string[]>;
  fielded: Record<string, FieldedSlot[]>;
  winnerId: string | null;
};

export type BracketType = "single" | "double";
export type MatchSide = "left" | "right" | "final";

export type Match = {
  id: string;
  round: number;
  side: MatchSide;
  bracket: "winners" | "losers" | "grand";
  playerAId: string | null;
  playerBId: string | null;
  winnerId: string | null;
  feedsInto: string | null;
  loserDropsTo: string | null;
  draft: DraftState | null;
  label: string;
};

export type TournamentStatus = "setup" | "knockout" | "complete";

export type Tournament = {
  id: string;
  name: string;
  format: BracketType;
  playerCount: number;
  costConfig: CostConfig;
  players: Player[];
  matches: Match[];
  status: TournamentStatus;
  championId: string | null;
  grandFinalReset: boolean;
  createdAt: number;
};

export const DEFAULT_COST_CONFIG: CostConfig = {
  maxCost: 7,
  limitedCharBase: 1,
  perCons: 1,
  limitedWeaponBase: 1,
  perRefine: 1,
  customRules: [],
};

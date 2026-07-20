import type {
  DraftSimulation,
  DraftState,
  Match,
  Player,
  RegisteredChar,
  Tournament,
} from "@/lib/types";

export const PLAYER_A_ID = "player-a";
export const PLAYER_B_ID = "player-b";

export type PlayerSlot = "A" | "B";

export function makePlayer(
  id: string,
  name: string,
  registration: RegisteredChar[],
  seed: number,
): Player {
  return { id, name, seed, registration, locked: false };
}

export function makeMatch(draft: DraftState | null): Match {
  return {
    id: "sim-match",
    round: 0,
    side: "final",
    bracket: "winners",
    playerAId: PLAYER_A_ID,
    playerBId: PLAYER_B_ID,
    winnerId: null,
    feedsInto: null,
    loserDropsTo: null,
    draft,
    label: "Draft Simulation",
  };
}

export function makeTournament(sim: DraftSimulation): Tournament {
  return {
    id: "sim-tournament",
    name: `${sim.playerAName} vs ${sim.playerBName}`,
    format: "single",
    type: "spiral",
    playerCount: 2,
    costConfig: sim.costConfig,
    players: [
      makePlayer(PLAYER_A_ID, sim.playerAName, sim.playerARegistration, 0),
      makePlayer(PLAYER_B_ID, sim.playerBName, sim.playerBRegistration, 1),
    ],
    matches: [makeMatch(sim.draft)],
    status: "knockout",
    championId: null,
    grandFinalReset: false,
    createdAt: sim.createdAt,
  };
}

export function playerReg(
  sim: DraftSimulation,
  player: PlayerSlot,
): RegisteredChar[] {
  return player === "A" ? sim.playerARegistration : sim.playerBRegistration;
}

export function playerName(
  sim: DraftSimulation,
  player: PlayerSlot | null,
): string {
  if (!player) return "";
  return player === "A" ? sim.playerAName : sim.playerBName;
}
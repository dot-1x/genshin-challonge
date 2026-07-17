import type { Match, MatchSide, Player } from "./types";
import { shuffle } from "./random";

function singleLabel(round: number, totalRounds: number): string {
  if (round === totalRounds) return "Grand Final";
  if (round === totalRounds - 1) return "Semifinal";
  if (round === totalRounds - 2) return "Quarterfinal";
  return `Round ${round}`;
}

export function generateSingleElim(players: Player[]): Match[] {
  const shuffled = shuffle(players);
  const n = shuffled.length;
  const totalRounds = Math.log2(n);
  const matches: Match[] = [];
  let counter = 0;
  const nextId = () => `m${++counter}`;

  function buildHalf(
    halfPlayers: Player[],
    side: MatchSide,
  ): string {
    if (halfPlayers.length < 2) return "";

    let prevIds: string[] = [];
    for (let i = 0; i < halfPlayers.length; i += 2) {
      const id = nextId();
      matches.push({
        id,
        round: 1,
        side,
        bracket: "winners",
        playerAId: halfPlayers[i].id,
        playerBId: halfPlayers[i + 1].id,
        winnerId: null,
        feedsInto: null,
        loserDropsTo: null,
        draft: null,
        label: singleLabel(1, totalRounds),
      });
      prevIds.push(id);
    }

    let currentRound = 1;
    while (prevIds.length > 1) {
      currentRound++;
      const currIds: string[] = [];
      for (let i = 0; i < prevIds.length; i += 2) {
        const id = nextId();
        matches.push({
          id,
          round: currentRound,
          side,
          bracket: "winners",
          playerAId: null,
          playerBId: null,
          winnerId: null,
          feedsInto: null,
          loserDropsTo: null,
          draft: null,
          label: singleLabel(currentRound, totalRounds),
        });
        const a = matches.find((m) => m.id === prevIds[i])!;
        const b = matches.find((m) => m.id === prevIds[i + 1])!;
        a.feedsInto = id;
        b.feedsInto = id;
        currIds.push(id);
      }
      prevIds = currIds;
    }
    return prevIds[0];
  }

  const half = n / 2;
  const leftFinalId = half >= 2 ? buildHalf(shuffled.slice(0, half), "left") : "";
  const rightFinalId = half >= 2 ? buildHalf(shuffled.slice(half), "right") : "";

  const finalId = nextId();
  matches.push({
    id: finalId,
    round: totalRounds,
    side: "final",
    bracket: "winners",
    playerAId: null,
    playerBId: null,
    winnerId: null,
    feedsInto: null,
    loserDropsTo: null,
    draft: null,
    label: "Grand Final",
  });

  if (leftFinalId) {
    matches.find((m) => m.id === leftFinalId)!.feedsInto = finalId;
    matches.find((m) => m.id === rightFinalId)!.feedsInto = finalId;
  } else {
    matches.find((m) => m.id === finalId)!.playerAId = shuffled[0].id;
    matches.find((m) => m.id === finalId)!.playerBId = shuffled[1].id;
  }

  return matches;
}

function wbLabel(round: number, totalRounds: number): string {
  if (round === totalRounds) return "Winners Final";
  return `Winners R${round}`;
}

function lbLabel(round: number, totalLbRounds: number): string {
  if (round === totalLbRounds) return "Losers Final";
  return `Losers R${round}`;
}

export function generateDoubleElim(players: Player[]): Match[] {
  const shuffled = shuffle(players);
  const n = shuffled.length;
  const totalRounds = Math.log2(n);
  const totalLbRounds = 2 * (totalRounds - 1);
  const matches: Match[] = [];
  let counter = 0;
  const nextId = () => `m${++counter}`;

  if (n === 2) {
    matches.push({
      id: nextId(),
      round: 1,
      side: "final",
      bracket: "grand",
      playerAId: shuffled[0].id,
      playerBId: shuffled[1].id,
      winnerId: null,
      feedsInto: null,
      loserDropsTo: null,
      draft: null,
      label: "Grand Final",
    });
    return matches;
  }

  const byId = (id: string) => matches.find((m) => m.id === id)!;

  // === Winners Bracket (left) ===
  const wbRounds: string[][] = [];
  let prevWbIds: string[] = [];
  wbRounds[1] = [];
  for (let i = 0; i < n; i += 2) {
    const id = nextId();
    matches.push({
      id,
      round: 1,
      side: "left",
      bracket: "winners",
      playerAId: shuffled[i].id,
      playerBId: shuffled[i + 1].id,
      winnerId: null,
      feedsInto: null,
      loserDropsTo: null,
      draft: null,
      label: wbLabel(1, totalRounds),
    });
    prevWbIds.push(id);
    wbRounds[1].push(id);
  }
  for (let r = 2; r <= totalRounds; r++) {
    wbRounds[r] = [];
    const currIds: string[] = [];
    for (let i = 0; i < prevWbIds.length; i += 2) {
      const id = nextId();
      matches.push({
        id,
        round: r,
        side: "left",
        bracket: "winners",
        playerAId: null,
        playerBId: null,
        winnerId: null,
        feedsInto: null,
        loserDropsTo: null,
        draft: null,
        label: wbLabel(r, totalRounds),
      });
      byId(prevWbIds[i]).feedsInto = id;
      byId(prevWbIds[i + 1]).feedsInto = id;
      currIds.push(id);
      wbRounds[r].push(id);
    }
    prevWbIds = currIds;
  }
  const wbFinalId = prevWbIds[0];

  // === Losers Bracket (right) ===
  const lbRounds: string[][] = [];

  for (let k = 1; k <= totalRounds - 1; k++) {
    // --- Minor round: LB R(2k-1) ---
    const minorRound = 2 * k - 1;
    lbRounds[minorRound] = [];
    const minorIds: string[] = [];

    if (k === 1) {
      const wbR1Ids = wbRounds[1];
      for (let i = 0; i < wbR1Ids.length; i += 2) {
        const id = nextId();
        matches.push({
          id,
          round: minorRound,
          side: "right",
          bracket: "losers",
          playerAId: null,
          playerBId: null,
          winnerId: null,
          feedsInto: null,
          loserDropsTo: null,
          draft: null,
          label: lbLabel(minorRound, totalLbRounds),
        });
        byId(wbR1Ids[i]).loserDropsTo = id;
        byId(wbR1Ids[i + 1]).loserDropsTo = id;
        minorIds.push(id);
        lbRounds[minorRound].push(id);
      }
    } else {
      const prevLbIds = lbRounds[2 * k - 2];
      for (let i = 0; i < prevLbIds.length; i += 2) {
        const id = nextId();
        matches.push({
          id,
          round: minorRound,
          side: "right",
          bracket: "losers",
          playerAId: null,
          playerBId: null,
          winnerId: null,
          feedsInto: null,
          loserDropsTo: null,
          draft: null,
          label: lbLabel(minorRound, totalLbRounds),
        });
        byId(prevLbIds[i]).feedsInto = id;
        byId(prevLbIds[i + 1]).feedsInto = id;
        minorIds.push(id);
        lbRounds[minorRound].push(id);
      }
    }

    // --- Major round: LB R(2k) ---
    const majorRound = 2 * k;
    lbRounds[majorRound] = [];
    const wbDropIds = wbRounds[k + 1];
    for (let i = 0; i < wbDropIds.length; i++) {
      const id = nextId();
      matches.push({
        id,
        round: majorRound,
        side: "right",
        bracket: "losers",
        playerAId: null,
        playerBId: null,
        winnerId: null,
        feedsInto: null,
        loserDropsTo: null,
        draft: null,
        label: lbLabel(majorRound, totalLbRounds),
      });
      byId(wbDropIds[i]).loserDropsTo = id;
      byId(minorIds[i]).feedsInto = id;
      lbRounds[majorRound].push(id);
    }
  }

  const lbFinalId = lbRounds[totalLbRounds][0];

  // === Grand Final (center) ===
  const gfId = nextId();
  matches.push({
    id: gfId,
    round: totalRounds + 1,
    side: "final",
    bracket: "grand",
    playerAId: null,
    playerBId: null,
    winnerId: null,
    feedsInto: null,
    loserDropsTo: null,
    draft: null,
    label: "Grand Final",
  });
  byId(wbFinalId).feedsInto = gfId;
  byId(lbFinalId).feedsInto = gfId;

  return matches;
}

export function generateBracket(
  format: "single" | "double",
  players: Player[],
): Match[] {
  return format === "single"
    ? generateSingleElim(players)
    : generateDoubleElim(players);
}

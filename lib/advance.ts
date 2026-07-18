import type { Tournament } from "./types";
import { uid } from "./random";

function clone<T>(t: T): T {
  return JSON.parse(JSON.stringify(t)) as T;
}

function assignToMatch(
  matches: Tournament["matches"],
  matchId: string,
  playerId: string,
) {
  const m = matches.find((x) => x.id === matchId);
  if (!m) return;
  if (m.playerAId === null) m.playerAId = playerId;
  else if (m.playerBId === null) m.playerBId = playerId;
}

export function applyResult(
  tournament: Tournament,
  matchId: string,
  winnerId: string,
): Tournament {
  const t = clone(tournament);
  const match = t.matches.find((m) => m.id === matchId);
  if (!match || !match.playerAId || !match.playerBId) return t;

  const loserId =
    winnerId === match.playerAId ? match.playerBId : match.playerAId;
  match.winnerId = winnerId;

  if (match.round === 1) {
    const winner = t.players.find((p) => p.id === winnerId);
    const loser = t.players.find((p) => p.id === loserId);
    if (winner) winner.locked = true;
    if (loser) loser.locked = true;
  }

  if (match.feedsInto) {
    assignToMatch(t.matches, match.feedsInto, winnerId);
  }
  if (match.loserDropsTo) {
    assignToMatch(t.matches, match.loserDropsTo, loserId);
  }

  if (match.side === "final" && t.format === "single") {
    t.championId = winnerId;
    t.status = "complete";
    return t;
  }

  if (match.bracket === "grand") {
    const hasLosersBracket = t.matches.some((m) => m.bracket === "losers");
    if (!t.grandFinalReset) {
      const wbWinnerWon = !hasLosersBracket || winnerId === match.playerAId;
      if (wbWinnerWon) {
        t.championId = winnerId;
        t.status = "complete";
      } else {
        t.grandFinalReset = true;
        t.matches.push({
          id: uid(),
          round: match.round,
          side: "final",
          bracket: "grand",
          playerAId: match.playerAId,
          playerBId: match.playerBId,
          winnerId: null,
          feedsInto: null,
          loserDropsTo: null,
          draft: null,
          label: "Grand Final Reset",
        });
      }
    } else {
      t.championId = winnerId;
      t.status = "complete";
    }
  }

  return t;
}

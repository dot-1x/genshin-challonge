"use client";

import { Fragment } from "react";
import type { Match, MatchSide, Tournament, RosterUnit } from "@/lib/types";
import { MatchCard } from "@/components/MatchCard";

const UNIT = 130;
const LINE = "bg-foreground/20";

function groupByRound(matches: Match[]): Map<number, Match[]> {
  const map = new Map<number, Match[]>();
  for (const m of matches) {
    if (!map.has(m.round)) map.set(m.round, []);
    map.get(m.round)!.push(m);
  }
  return map;
}

export function BracketView({
  tournament,
  rosterMap,
  onOpenDraft,
  onOpenRegistration,
}: {
  tournament: Tournament;
  rosterMap: Map<string, RosterUnit>;
  onOpenDraft: (matchId: string) => void;
  onOpenRegistration: (playerId: string) => void;
}) {
  const leftMatches = tournament.matches.filter((m) => m.side === "left");
  const rightMatches = tournament.matches.filter((m) => m.side === "right");
  const finalMatches = tournament.matches.filter((m) => m.side === "final");

  const leftRounds = [...groupByRound(leftMatches).entries()].sort(
    (a, b) => a[0] - b[0],
  );
  const rightRounds = [...groupByRound(rightMatches).entries()].sort(
    (a, b) => b[0] - a[0],
  );

  const maxColumnSize = Math.max(
    ...leftRounds.map(([, ms]) => ms.length),
    ...rightRounds.map(([, ms]) => ms.length),
    1,
  );
  const columnHeight = maxColumnSize * UNIT;

  return (
    <div className="h-full overflow-auto">
      <div className="flex items-center w-max mx-auto min-h-full py-10 gap-8">
        {leftRounds.map(([round, matches]) => (
          <BracketColumn
            key={`l-${round}`}
            side="left"
            matches={matches}
            tournament={tournament}
            rosterMap={rosterMap}
            columnHeight={columnHeight}
            onOpenDraft={onOpenDraft}
            onOpenRegistration={onOpenRegistration}
          />
        ))}

        {finalMatches.length > 0 && (
          <FinalColumn
            matches={finalMatches}
            tournament={tournament}
            rosterMap={rosterMap}
            columnHeight={columnHeight}
            onOpenDraft={onOpenDraft}
            onOpenRegistration={onOpenRegistration}
          />
        )}

        {rightRounds.map(([round, matches]) => (
          <BracketColumn
            key={`r-${round}`}
            side="right"
            matches={matches}
            tournament={tournament}
            rosterMap={rosterMap}
            columnHeight={columnHeight}
            onOpenDraft={onOpenDraft}
            onOpenRegistration={onOpenRegistration}
          />
        ))}
      </div>
    </div>
  );
}

function BracketColumn({
  side,
  matches,
  tournament,
  rosterMap,
  columnHeight,
  onOpenDraft,
  onOpenRegistration,
}: {
  side: MatchSide;
  matches: Match[];
  tournament: Tournament;
  rosterMap: Map<string, RosterUnit>;
  columnHeight: number;
  onOpenDraft: (matchId: string) => void;
  onOpenRegistration: (playerId: string) => void;
}) {
  const numMatches = matches.length;
  const slotHeight = columnHeight / numMatches;
  const isLeft = side === "left";

  return (
    <div className="flex flex-col">
      <div className="text-xs text-muted-foreground font-medium mb-2 text-center w-64">
        {matches[0]?.label ?? ""}
      </div>
      <div className="flex flex-col" style={{ height: columnHeight }}>
        {matches.map((m, i) => {
          const isTop = i % 2 === 0;
          const isPaired = numMatches > 1;
          const hasFeeds = !!m.feedsInto;
          return (
            <div
              key={m.id}
              className="relative flex items-center w-64"
              style={{ height: slotHeight }}
            >
              <MatchCard
                match={m}
                tournament={tournament}
                rosterMap={rosterMap}
                onOpenDraft={() => onOpenDraft(m.id)}
                onOpenRegistration={onOpenRegistration}
              />
              <Connectors
                isLeft={isLeft}
                isTop={isTop}
                isPaired={isPaired}
                hasFeeds={hasFeeds}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Connectors({
  isLeft,
  isTop,
  isPaired,
  hasFeeds,
}: {
  isLeft: boolean;
  isTop: boolean;
  isPaired: boolean;
  hasFeeds: boolean;
}) {
  if (!hasFeeds) return null;

  const edge = isLeft ? "left-full" : "right-full";
  const offset = isLeft ? "ml-4" : "mr-4";

  if (!isPaired) {
    return (
      <div
        className={`absolute ${edge} top-1/2 -translate-y-1/2 h-[2px] w-8 ${LINE}`}
      />
    );
  }

  return (
    <>
      <div
        className={`absolute ${edge} top-1/2 -translate-y-1/2 h-[2px] w-4 ${LINE}`}
      />
      {isTop ? (
        <div
          className={`absolute ${edge} ${offset} top-1/2 bottom-0 w-[2px] ${LINE}`}
        />
      ) : (
        <div
          className={`absolute ${edge} ${offset} top-0 h-1/2 w-[2px] ${LINE}`}
        />
      )}
      {isTop && (
        <div
          className={`absolute ${edge} ${offset} bottom-0 h-[2px] w-4 ${LINE}`}
        />
      )}
    </>
  );
}

function FinalColumn({
  matches,
  tournament,
  rosterMap,
  columnHeight,
  onOpenDraft,
  onOpenRegistration,
}: {
  matches: Match[];
  tournament: Tournament;
  rosterMap: Map<string, RosterUnit>;
  columnHeight: number;
  onOpenDraft: (matchId: string) => void;
  onOpenRegistration: (playerId: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <div className="text-xs text-muted-foreground font-medium mb-2 text-center w-64">
        {matches[0]?.label ?? "Final"}
      </div>
      <div
        className="flex flex-col justify-center items-center gap-3"
        style={{ height: columnHeight }}
      >
        {matches.map((m, i) => (
          <Fragment key={m.id}>
            {i > 0 && (
              <div className="flex flex-col items-center -my-1">
                <div className={`w-[2px] h-5 ${LINE}`} />
                <span className="text-[10px] text-muted-foreground px-1 bg-background leading-tight">
                  Loser of GF
                </span>
                <div className={`w-[2px] h-5 ${LINE}`} />
              </div>
            )}
            <MatchCard
              match={m}
              tournament={tournament}
              rosterMap={rosterMap}
              onOpenDraft={() => onOpenDraft(m.id)}
              onOpenRegistration={onOpenRegistration}
            />
          </Fragment>
        ))}
      </div>
    </div>
  );
}

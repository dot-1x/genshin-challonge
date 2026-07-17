"use client";

import { useState, useMemo } from "react";
import type { Player, RosterUnit, RegisteredChar } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UnitIcon } from "@/components/UnitIcon";
import { Lock, Search, X, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export function RegistrationModal({
  player,
  roster,
  onSave,
  onOpenChange,
}: {
  player: Player | null;
  roster: RosterUnit[];
  onSave: (registration: RegisteredChar[]) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [registration, setRegistration] = useState<RegisteredChar[]>(
    player?.registration ?? [],
  );

  const limitedChars = useMemo(
    () =>
      roster.filter((u) => u.kind === "character" && u.banner === "limited"),
    [roster],
  );

  const registeredIds = new Set(registration.map((r) => r.unitId));

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return limitedChars;
    return limitedChars.filter((u) => u.name.toLowerCase().includes(q));
  }, [limitedChars, search]);

  function addChar(unit: RosterUnit) {
    if (registeredIds.has(unit.id)) return;
    setRegistration((r) => [...r, { unitId: unit.id, cons: 0 }]);
  }

  function removeChar(unitId: string) {
    setRegistration((r) => r.filter((reg) => reg.unitId !== unitId));
  }

  function setCons(unitId: string, cons: number) {
    setRegistration((r) =>
      r.map((reg) => (reg.unitId === unitId ? { ...reg, cons } : reg)),
    );
  }

  function handleSave() {
    onSave(registration);
    onOpenChange(false);
  }

  if (!player) return null;
  const locked = player.locked;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {player.name}
            {locked && (
              <Badge variant="secondary">
                <Lock className="size-3" />
                Locked
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Register limited 5★ characters for this player. Standard 5★
            characters are free and don&apos;t need registration.
          </DialogDescription>
        </DialogHeader>

        {locked ? (
          <div className="flex-1 overflow-y-auto space-y-2">
            {registration.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No registered characters.
              </p>
            ) : (
              registration.map((reg) => {
                const unit = roster.find((u) => u.id === reg.unitId);
                if (!unit) return null;
                return (
                  <div
                    key={reg.unitId}
                    className="flex items-center gap-3 rounded-lg border p-2"
                  >
                    <UnitIcon unit={unit} size={36} />
                    <span className="flex-1 font-medium">{unit.name}</span>
                    <Badge variant="outline">C{reg.cons}</Badge>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-hidden flex flex-col gap-4">
              <div className="space-y-2">
                <Label>
                  Registered Limited 5★ ({registration.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {registration.map((reg) => {
                    const unit = roster.find((u) => u.id === reg.unitId);
                    if (!unit) return null;
                    return (
                      <div
                        key={reg.unitId}
                        className="flex items-center gap-2 rounded-lg border bg-muted/50 p-1.5 pr-2"
                      >
                        <UnitIcon unit={unit} size={28} />
                        <span className="text-sm font-medium">{unit.name}</span>
                        <Select
                          value={String(reg.cons)}
                          onValueChange={(v) => { if (v) setCons(reg.unitId, Number(v)); }}
                        >
                          <SelectTrigger className="h-7 w-16">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[0, 1, 2, 3, 4, 5, 6].map((c) => (
                              <SelectItem key={c} value={String(c)}>
                                C{c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() => removeChar(reg.unitId)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    );
                  })}
                  {registration.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No characters registered yet.
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
                <Label>Add Limited 5★ Character</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search characters..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="flex-1">
                  <div className="grid grid-cols-2 gap-1.5 pr-2">
                    {filtered.map((unit) => {
                      const isRegistered = registeredIds.has(unit.id);
                      return (
                        <button
                          key={unit.id}
                          onClick={() => !isRegistered && addChar(unit)}
                          disabled={isRegistered}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border p-1.5 text-left transition-colors",
                            isRegistered
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:border-primary hover:bg-muted/50",
                          )}
                        >
                          <UnitIcon unit={unit} size={28} />
                          <span className="text-sm font-medium truncate flex-1">
                            {unit.name}
                          </span>
                          {!isRegistered && (
                            <Plus className="size-3.5 text-muted-foreground" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Registration</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

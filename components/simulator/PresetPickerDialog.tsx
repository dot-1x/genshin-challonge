"use client";

import type { RegistrationPreset } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export function PresetPickerDialog({
  open,
  playerName: nameLabel,
  presets,
  onPickPreset,
  onCreateManually,
  onOpenChange,
}: {
  open: boolean;
  playerName: string;
  presets: RegistrationPreset[];
  onPickPreset: (presetId: string | null) => void;
  onCreateManually: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Register {nameLabel}</DialogTitle>
          <DialogDescription>
            Load a saved preset or create a new registration.
          </DialogDescription>
        </DialogHeader>
        {presets.length > 0 && (
          <div className="space-y-2">
            <Label>Load from preset</Label>
            <Select onValueChange={onPickPreset}>
              <SelectTrigger>
                <SelectValue placeholder="Select a preset..." />
              </SelectTrigger>
              <SelectContent>
                {presets.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.characters.length} chars)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={onCreateManually}
          >
            <Plus className="size-4" />
            Create Manually
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
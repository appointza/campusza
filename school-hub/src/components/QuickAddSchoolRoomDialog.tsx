import { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { schoolRoomApi } from "@/services/school-room.service";
import { Plus } from "lucide-react";

function saveRoomErrorMessage(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) return fallback;
  const data = err.response?.data;
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data) as { message?: string };
      if (parsed.message) return parsed.message;
    } catch {
      /* ignore */
    }
  }
  return fallback;
}

type QuickAddSchoolRoomDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (room: { id: string; name: string }) => void;
  defaultCapacity?: number;
};

export function QuickAddSchoolRoomDialog({
  open,
  onOpenChange,
  onCreated,
  defaultCapacity = 30,
}: QuickAddSchoolRoomDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(defaultCapacity);

  useEffect(() => {
    if (!open) return;
    setName("");
    setCapacity(defaultCapacity);
  }, [open, defaultCapacity]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast({ title: "Room name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const saved = await schoolRoomApi.save({
        name: trimmed,
        capacity: capacity > 0 ? capacity : 30,
        isActive: true,
      });
      toast({ title: "Room created", description: trimmed });
      onCreated({ id: saved.id, name: saved.name });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: saveRoomErrorMessage(err, "Could not save room"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add room</DialogTitle>
          <DialogDescription>
            Creates a school room you can assign as this class homeroom. Same rooms are used on the timetable and exams.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="quick-room-name">Room name *</Label>
            <Input
              id="quick-room-name"
              placeholder="e.g. Room 101"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSave();
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-room-capacity">Capacity</Label>
            <Input
              id="quick-room-capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving…" : "Save room"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ClassRoomPickerProps = {
  roomId?: string;
  onRoomChange: (roomId: string) => void;
  roomOptions: Array<{ id: string; name: string }>;
  selectValue: (roomId?: string) => string;
  homeroomOwner?: (
    roomId: string,
    exceptClassId?: string,
    academicYear?: string
  ) => { name: string } | undefined;
  exceptClassId?: string;
  academicYear?: string;
  defaultCapacity?: number;
  onRoomListRefresh: () => Promise<Array<{ id: string; name: string }>>;
  triggerClassName?: string;
};

/** Room dropdown for class homeroom; offers inline create when the org has no rooms yet. */
export function ClassRoomPicker({
  roomId,
  onRoomChange,
  roomOptions,
  selectValue,
  homeroomOwner,
  exceptClassId,
  academicYear,
  defaultCapacity = 30,
  onRoomListRefresh,
  triggerClassName,
}: ClassRoomPickerProps) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const handleCreated = async (room: { id: string; name: string }) => {
    await onRoomListRefresh();
    onRoomChange(room.id);
  };

  if (roomOptions.length === 0) {
    return (
      <>
        <div className="rounded-lg border border-dashed bg-muted/30 p-4 space-y-3">
          <p className="text-sm text-muted-foreground">No rooms yet. Add one in Settings → References → School rooms.</p>
          <Button type="button" variant="secondary" size="sm" onClick={() => setQuickAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add room
          </Button>
        </div>
        <QuickAddSchoolRoomDialog
          open={quickAddOpen}
          onOpenChange={setQuickAddOpen}
          onCreated={(room) => void handleCreated(room)}
          defaultCapacity={defaultCapacity}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-start gap-2">
        <Select
          value={selectValue(roomId)}
          onValueChange={(value) => onRoomChange(value === "none" ? "" : value)}
        >
          <SelectTrigger className={triggerClassName ?? "w-full min-w-0 flex-1"}>
            <SelectValue placeholder="Select room" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Not set</SelectItem>
            {roomOptions.map((room) => {
              const taken = homeroomOwner?.(room.id, exceptClassId, academicYear);
              return (
                <SelectItem key={room.id} value={room.id} disabled={!!taken}>
                  {taken ? `${room.name} (assigned to ${taken.name})` : room.name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          title="Add another room"
          onClick={() => setQuickAddOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <QuickAddSchoolRoomDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onCreated={(room) => void handleCreated(room)}
        defaultCapacity={defaultCapacity}
      />
    </>
  );
}

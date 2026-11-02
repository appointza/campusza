import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { examRoomApi } from "@/services/exam-room.service";
import type { ExamRoom } from "@/models/exam.model";
import { Plus, Search } from "lucide-react";

const emptyRoom = (): Partial<ExamRoom> => ({
  name: "",
  building: "",
  floor: "",
  capacity: 30,
  rowsCount: undefined,
  columnsCount: undefined,
  linkedClassId: "",
  isActive: true,
});

type Props = {
  onCountChange?: (count: number) => void;
};

export function SettingsSchoolRoomsPanel({ onCountChange }: Props) {
  const { toast } = useToast();
  const [initialLoading, setInitialLoading] = useState(true);
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<ExamRoom>>(emptyRoom());
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const onCountChangeRef = useRef(onCountChange);
  onCountChangeRef.current = onCountChange;
  const hasLoadedRef = useRef(false);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent && !hasLoadedRef.current) {
      setInitialLoading(true);
    }
    setLoadError(null);
    try {
      const list = await examRoomApi.select(true);
      const active = list.filter((r) => r.isActive !== false);
      setRooms(list);
      onCountChangeRef.current?.(active.length);
      hasLoadedRef.current = true;
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? typeof err.response?.data === "string"
          ? err.response.data
          : err.message
        : "Could not load rooms";
      setLoadError(message);
      onCountChangeRef.current?.(0);
      if (!options?.silent) {
        toast({
          title: "Failed to load rooms",
          description: "Check that the API is running and the school_rooms migration has been applied.",
          variant: "destructive",
        });
      }
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((r) =>
      [r.name, r.building, r.floor].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rooms, search]);

  const save = async () => {
    if (!form.name?.trim()) {
      toast({ title: "Room name is required", variant: "destructive" });
      return;
    }
    try {
      await examRoomApi.save(form);
      toast({ title: "Room saved" });
      setOpen(false);
      setForm(emptyRoom());
      await load({ silent: true });
    } catch (err) {
      let message = "Could not save room";
      if (axios.isAxiosError(err) && typeof err.response?.data === "string") {
        try {
          const parsed = JSON.parse(err.response.data) as { message?: string };
          if (parsed.message) message = parsed.message;
        } catch {
          /* ignore */
        }
      }
      toast({ title: message, variant: "destructive" });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="hero"
          size="sm"
          className="shrink-0"
          onClick={() => {
            setForm(emptyRoom());
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add room
        </Button>
      </div>

      {initialLoading ? (
        <p className="text-sm text-muted-foreground">Loading rooms…</p>
      ) : filtered.length === 0 ? (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>{rooms.length === 0 ? "No rooms yet. Add a room to assign homerooms and timetable slots." : "No rooms match your search."}</p>
          {loadError ? <p className="text-destructive">{loadError}</p> : null}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border border-border/60 w-full">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Layout</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{[r.building, r.floor].filter(Boolean).join(" · ") || "—"}</TableCell>
                  <TableCell>{r.capacity}</TableCell>
                  <TableCell>
                    {r.rowsCount && r.columnsCount ? `${r.rowsCount}×${r.columnsCount}` : "Sequential"}
                  </TableCell>
                  <TableCell>{r.isActive !== false ? "Active" : "Inactive"}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setForm(r);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit room" : "New room"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Building</Label>
                <Input value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} />
              </div>
              <div>
                <Label>Floor</Label>
                <Input value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Capacity</Label>
              <Input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Rows (optional)</Label>
                <Input
                  type="number"
                  value={form.rowsCount ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, rowsCount: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </div>
              <div>
                <Label>Columns (optional)</Label>
                <Input
                  type="number"
                  value={form.columnsCount ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, columnsCount: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.isActive !== false}
                onCheckedChange={(v) => setForm({ ...form, isActive: v === true })}
              />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={() => void save()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

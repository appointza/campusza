import { useEffect, useState } from "react";
import axios from "axios";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { examRoomApi } from "@/services/exam-room.service";
import type { ExamRoom } from "@/models/exam.model";
import { Plus } from "lucide-react";

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

const AdminExamRooms = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<ExamRoom>>(emptyRoom());

  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setRooms(await examRoomApi.select(true));
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? typeof err.response?.data === "string"
          ? err.response.data
          : err.message
        : "Could not load rooms";
      setLoadError(message);
      toast({
        title: "Failed to load rooms",
        description: "Check that the API is running and the school_rooms migration has been applied.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      await examRoomApi.save(form);
      toast({ title: "Room saved" });
      setOpen(false);
      setForm(emptyRoom());
      await load();
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
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold">School rooms</h1>
            <p className="text-muted-foreground mt-1">
              Any room can be used as a classroom, on the timetable, or for exams
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add room
              </Button>
            </DialogTrigger>
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
                      onChange={(e) => setForm({ ...form, rowsCount: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div>
                    <Label>Columns (optional)</Label>
                    <Input
                      type="number"
                      value={form.columnsCount ?? ""}
                      onChange={(e) => setForm({ ...form, columnsCount: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={form.isActive !== false} onCheckedChange={(v) => setForm({ ...form, isActive: v === true })} />
                  Active
                </label>
              </div>
              <DialogFooter>
                <Button onClick={save}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : rooms.length === 0 ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>No rooms yet. Add rooms here, then assign them on Classes and the timetable.</p>
                {loadError ? (
                  <p className="text-destructive">{loadError}</p>
                ) : null}
              </div>
            ) : (
              <Table>
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
                  {rooms.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>
                        {[r.building, r.floor].filter(Boolean).join(" · ") || "—"}
                      </TableCell>
                      <TableCell>{r.capacity}</TableCell>
                      <TableCell>
                        {r.rowsCount && r.columnsCount ? `${r.rowsCount}×${r.columnsCount}` : "Sequential"}
                      </TableCell>
                      <TableCell>{r.isActive !== false ? "Active" : "Inactive"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => { setForm(r); setOpen(true); }}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminExamRooms;

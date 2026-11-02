import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { examService } from "@/services/exam.service";
import { examRoomApi } from "@/services/exam-room.service";
import { pageService } from "@/services/page.service";
import { studentEnrollmentService } from "@/services/student-enrollment.service";
import type { ExamGenerateSeatsResult, ExamRoom } from "@/models/exam.model";
import type { StudentEnrollmentWithProfile } from "@/models/student-enrollment.model";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Trash2 } from "lucide-react";

const AdminExamSessionSeating = () => {
  const { seriesId = "", sessionId = "" } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [sessionRooms, setSessionRooms] = useState<{ examroomid: string; allocatedcapacity: number; roomname?: string }[]>([]);
  const [seats, setSeats] = useState<Record<string, unknown>[]>([]);
  const [staffOptions, setStaffOptions] = useState<{ id: string; name: string }[]>([]);
  const [strategy, setStrategy] = useState<"RollNumber" | "AdmissionNumber">("RollNumber");
  const [genStats, setGenStats] = useState<ExamGenerateSeatsResult | null>(null);
  const [correctionReason, setCorrectionReason] = useState("");
  const [enrollments, setEnrollments] = useState<StudentEnrollmentWithProfile[]>([]);
  const [invigilators, setInvigilators] = useState<Record<string, unknown>[]>([]);
  const [manualEnrollmentId, setManualEnrollmentId] = useState("");
  const [manualRoomId, setManualRoomId] = useState("");
  const [manualSeatLabel, setManualSeatLabel] = useState("");
  const [manualLock, setManualLock] = useState(true);
  const [manualReplace, setManualReplace] = useState(false);
  const [invRoomId, setInvRoomId] = useState("");
  const [invStaffId, setInvStaffId] = useState("");
  const [invRole, setInvRole] = useState("Invigilator");

  const load = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const [masterRooms, assigned, seatRows, staffPage, invRows, sessions] = await Promise.all([
        examRoomApi.select(false),
        examService.selectSessionRooms(sessionId),
        examService.selectSeats(sessionId),
        pageService.getAdminStaffPage(),
        examService.selectInvigilators(sessionId),
        seriesId ? examService.selectSessions(seriesId) : Promise.resolve([]),
      ]);
      setRooms(masterRooms.filter((r) => r.isActive !== false));
      setSessionRooms(
        (assigned as Record<string, unknown>[]).map((r) => ({
          examroomid: String(r.examroomid ?? ""),
          allocatedcapacity: Number(r.allocatedcapacity ?? 0),
          roomname: String(r.roomname ?? ""),
        }))
      );
      setSeats(seatRows as Record<string, unknown>[]);
      setInvigilators(invRows as Record<string, unknown>[]);
      const session = sessions.find((s) => s.id === sessionId);
      const classIds = session?.classIds?.filter(Boolean) ?? [];
      const enrollmentLists = await Promise.all(
        classIds.map((classId) => studentEnrollmentService.selectWithProfile({ classId, isCurrent: true }))
      );
      const byEnrollment = new Map<string, StudentEnrollmentWithProfile>();
      enrollmentLists.flat().forEach((e) => {
        if (e.enrollmentId) byEnrollment.set(e.enrollmentId, e);
      });
      setEnrollments([...byEnrollment.values()].sort((a, b) => (a.rollNumber ?? 0) - (b.rollNumber ?? 0)));
      const staff = Array.isArray(staffPage.staff) ? staffPage.staff : [];
      setStaffOptions(
        staff.map((s) => {
          const row = s as Record<string, unknown>;
          return { id: String(row.id ?? row.staffid ?? ""), name: String(row.fullname ?? row.name ?? "") };
        })
      );
    } catch {
      toast({ title: "Failed to load seating", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [sessionId, seriesId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const saveRooms = async () => {
    try {
      await examService.saveSessionRooms(sessionId, sessionRooms, {
        allowcorrection: Boolean(correctionReason),
        reason: correctionReason,
      });
      toast({ title: "Session rooms saved" });
      await load();
    } catch {
      toast({ title: "Could not save room allocation", variant: "destructive" });
    }
  };

  const assignedRoomOptions = sessionRooms.filter((r) => r.examroomid);

  const assignManual = async () => {
    if (!manualEnrollmentId || !manualRoomId || !manualSeatLabel.trim()) {
      toast({ title: "Student, room, and seat label are required", variant: "destructive" });
      return;
    }
    try {
      await examService.assignSeat({
        examsessionid: sessionId,
        examroomid: manualRoomId,
        studentenrollmentid: manualEnrollmentId,
        seatlabel: manualSeatLabel.trim(),
        islocked: manualLock,
        replaceexisting: manualReplace,
        allowcorrection: Boolean(correctionReason),
        reason: correctionReason,
      });
      toast({ title: "Seat assigned" });
      setManualSeatLabel("");
      await load();
    } catch {
      toast({ title: "Could not assign seat", variant: "destructive" });
    }
  };

  const addInvigilator = async () => {
    if (!invRoomId || !invStaffId) {
      toast({ title: "Room and staff are required", variant: "destructive" });
      return;
    }
    try {
      await examService.saveInvigilator({
        examsessionid: sessionId,
        examroomid: invRoomId,
        staffid: invStaffId,
        role: invRole.trim() || "Invigilator",
      });
      toast({ title: "Invigilator saved" });
      setInvStaffId("");
      await load();
    } catch {
      toast({ title: "Could not save invigilator", variant: "destructive" });
    }
  };

  const removeInvigilator = async (id: string) => {
    try {
      await examService.deleteInvigilator(id);
      toast({ title: "Invigilator removed" });
      await load();
    } catch {
      toast({ title: "Could not remove invigilator", variant: "destructive" });
    }
  };

  const generate = async () => {
    try {
      const res = (await examService.generateSeats(sessionId, strategy, {
        preservemanual: true,
        allowcorrection: Boolean(correctionReason),
        reason: correctionReason,
      })) as ExamGenerateSeatsResult;
      setGenStats(res);
      if (res.errors?.length) {
        toast({ title: "Seating issue", description: res.errors.join(" "), variant: "destructive" });
      } else {
        toast({ title: "Seating generated", description: `${res.allocatedstudents}/${res.totalstudents} seated` });
      }
      await load();
    } catch {
      toast({ title: "Generate failed", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/admin/exams/${seriesId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Seating & invigilation</h1>
            <p className="text-sm text-muted-foreground">Session {sessionId.slice(0, 8)}…</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Room allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessionRooms.map((row, idx) => (
              <div key={row.examroomid || idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                <div>
                  <Label>Room</Label>
                  <Select
                    value={row.examroomid}
                    onValueChange={(v) => {
                      const next = [...sessionRooms];
                      next[idx] = { ...next[idx], examroomid: v };
                      setSessionRooms(next);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((r) => (
                        <SelectItem key={r.id} value={r.id!}>
                          {r.name} ({r.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Allocated seats</Label>
                  <Input
                    type="number"
                    value={row.allocatedcapacity}
                    onChange={(e) => {
                      const next = [...sessionRooms];
                      next[idx] = { ...next[idx], allocatedcapacity: Number(e.target.value) };
                      setSessionRooms(next);
                    }}
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={() => setSessionRooms([...sessionRooms, { examroomid: "", allocatedcapacity: 30 }])}>
              Add room row
            </Button>
            <div>
              <Label>Correction reason (published sessions)</Label>
              <Input value={correctionReason} onChange={(e) => setCorrectionReason(e.target.value)} />
            </div>
            <Button onClick={saveRooms}>Save room allocation</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auto seating</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 items-end">
            <div>
              <Label>Strategy</Label>
              <Select value={strategy} onValueChange={(v) => setStrategy(v as "RollNumber" | "AdmissionNumber")}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RollNumber">Roll number</SelectItem>
                  <SelectItem value="AdmissionNumber">Admission number</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generate}>Generate seats</Button>
            {genStats ? (
              <p className="text-sm text-muted-foreground">
                Total {genStats.totalstudents}, seated {genStats.allocatedstudents}, unallocated {genStats.unallocatedstudents}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual seat assignment</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 items-end">
            <div>
              <Label>Student</Label>
              <Select value={manualEnrollmentId} onValueChange={setManualEnrollmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {enrollments.map((e) => (
                    <SelectItem key={e.enrollmentId} value={e.enrollmentId}>
                      {e.fullName || `${e.firstName} ${e.lastName}`.trim()} — {e.className}
                      {e.rollNumber != null ? ` (#${e.rollNumber})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Room (session allocation)</Label>
              <Select value={manualRoomId} onValueChange={setManualRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {assignedRoomOptions.map((r) => (
                    <SelectItem key={r.examroomid} value={r.examroomid}>
                      {r.roomname || r.examroomid.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Seat label</Label>
              <Input value={manualSeatLabel} onChange={(e) => setManualSeatLabel(e.target.value)} placeholder="e.g. R1-C2 or 12" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="manual-lock" checked={manualLock} onCheckedChange={(v) => setManualLock(v === true)} />
              <Label htmlFor="manual-lock">Lock seat (preserve on auto-generate)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="manual-replace" checked={manualReplace} onCheckedChange={(v) => setManualReplace(v === true)} />
              <Label htmlFor="manual-replace">Replace occupant if seat taken</Label>
            </div>
            <Button onClick={assignManual}>Assign seat</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invigilators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4 items-end">
              <div>
                <Label>Room</Label>
                <Select value={invRoomId} onValueChange={setInvRoomId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Room" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedRoomOptions.map((r) => (
                      <SelectItem key={r.examroomid} value={r.examroomid}>
                        {r.roomname || r.examroomid.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Staff</Label>
                <Select value={invStaffId} onValueChange={setInvStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffOptions.filter((s) => s.id).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Role</Label>
                <Input value={invRole} onChange={(e) => setInvRole(e.target.value)} />
              </div>
              <Button onClick={addInvigilator}>Add</Button>
            </div>
            {invigilators.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invigilators assigned.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invigilators.map((iv) => (
                    <TableRow key={String(iv.id)}>
                      <TableCell>{String(iv.roomname ?? "")}</TableCell>
                      <TableCell>{String(iv.staffname ?? "")}</TableCell>
                      <TableCell>{String(iv.role ?? "")}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeInvigilator(String(iv.id))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seat plan</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : seats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No seats allocated yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Seat</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seats.map((s) => (
                    <TableRow key={String(s.id)}>
                      <TableCell>{String(s.roomname ?? "")}</TableCell>
                      <TableCell>{String(s.seatlabel ?? "")}</TableCell>
                      <TableCell>{String(s.studentname ?? "")}</TableCell>
                      <TableCell>{String(s.classname ?? "")}</TableCell>
                      <TableCell>{String(s.allocationsource ?? "")}</TableCell>
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

export default AdminExamSessionSeating;

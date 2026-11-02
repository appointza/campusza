import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { AlertTriangle, CheckCircle, RefreshCw, UserCheck, UserX, XCircle } from "lucide-react";
import type { StaffLeave, StaffMember, StaffReplacement, ScheduleEntry } from "@/models/staff.model";
import type { AffectedScheduleItem } from "../utils/schedule-replacements";
import { formatDateRange, formatShortDate, isPastDateYmd, minTodayYmd } from "@/utils/date";
import { getLeaveStatusColor, getLeaveTypeLabel } from "@/models/staff.model";

type Props = {
  leaves: StaffLeave[];
  replacements: StaffReplacement[];
  staffMembers: StaffMember[];
  schedule: ScheduleEntry[];
  pendingCount: number;
  onApproveLeave: (id: string) => void;
  onRejectLeave: (id: string) => void;
  onRecordLeave: (data: {
    staffId: string;
    leaveType: StaffLeave["leaveType"];
    startDate: string;
    endDate: string;
    reason: string;
  }) => void | Promise<void>;
  onAssignReplacement: (data: {
    scheduleId: string;
    originalTeacherId: string;
    replacementTeacherId: string;
    subjectId: string;
    date: string;
    reason: string;
  }) => void | Promise<void>;
  getAffectedSchedules: () => AffectedScheduleItem[];
  subjectOptions: { id: string; name: string }[];
  getFreeReplacementTeachers: (
    excludeId: string,
    scheduleId: string,
    dateYmd: string
  ) => StaffMember[];
  getTeacherSubjectOptions: (teacherId: string) => { id: string; name: string }[];
};

export function LeaveReplacementsPanel({
  leaves,
  replacements,
  staffMembers,
  pendingCount,
  onApproveLeave,
  onRejectLeave,
  onRecordLeave,
  onAssignReplacement,
  getAffectedSchedules,
  getFreeReplacementTeachers,
  getTeacherSubjectOptions,
  subjectOptions,
}: Props) {
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    staffId: "",
    leaveType: "" as StaffLeave["leaveType"],
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [repForm, setRepForm] = useState({
    scheduleId: "",
    originalTeacherId: "",
    replacementTeacherId: "",
    subjectId: "",
    date: "",
    reason: "",
  });

  const resolveScheduleSubjectId = (subjectLabel: string, subjectId?: string) =>
    subjectId ||
    subjectOptions.find((o) => o.name.toLowerCase() === subjectLabel.toLowerCase())?.id ||
    "";
  const [repOpen, setRepOpen] = useState(false);

  const affected = getAffectedSchedules();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-end">
        <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <UserX className="w-4 h-4 mr-1" />
              Record Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>Record Staff Leave</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-2">
                <Label>Teacher</Label>
                <Select value={leaveForm.staffId} onValueChange={(v) => setLeaveForm({ ...leaveForm, staffId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Leave type</Label>
                <Select
                  value={leaveForm.leaveType}
                  onValueChange={(v) => setLeaveForm({ ...leaveForm, leaveType: v as StaffLeave["leaveType"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sick">Sick</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Start</Label>
                  <Input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End</Label>
                  <Input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="hero"
                onClick={async () => {
                  try {
                    await onRecordLeave(leaveForm);
                    setLeaveOpen(false);
                    setLeaveForm({
                      staffId: "",
                      leaveType: "" as StaffLeave["leaveType"],
                      startDate: "",
                      endDate: "",
                      reason: "",
                    });
                  } catch {
                    /* parent shows toast; keep dialog open */
                  }
                }}
              >
                Submit Leave
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {pendingCount > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {pendingCount} pending leave request{pendingCount === 1 ? "" : "s"}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>Review and approve staff leave</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell>{leave.staffName}</TableCell>
                  <TableCell>{getLeaveTypeLabel(leave.leaveType)}</TableCell>
                  <TableCell className="text-sm">
                    {formatDateRange(leave.startDate, leave.endDate)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getLeaveStatusColor(leave.status)}>{leave.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {leave.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => onApproveLeave(leave.id)}>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onRejectLeave(leave.id)}>
                          <XCircle className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Classes Needing Replacement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {affected.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No classes need replacement this week.</p>
          ) : (
            affected.map(({ schedule: s, leave, date }) => {
              const scheduledSubjectId = resolveScheduleSubjectId(s.subject, s.subjectId);
              const freeTeachers = getFreeReplacementTeachers(s.teacherId, s.id, date);
              const teacherSubjectOptions = repForm.replacementTeacherId
                ? getTeacherSubjectOptions(repForm.replacementTeacherId)
                : [];
              return (
              <div key={`${s.id}|${date}`} className="border rounded-lg p-3 space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="font-medium">{s.subject}</span>
                  <Badge variant="outline">{s.class}</Badge>
                  <Badge variant="secondary">{formatShortDate(date)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {s.day} {s.time} · {s.room}
                </p>
                <p className="text-sm">
                  Teacher: <span className="line-through">{s.teacher}</span>
                  <span className="text-red-600 ml-1">({leave.leaveType} leave)</span>
                </p>
                {isPastDateYmd(date) ? (
                  <p className="text-xs text-muted-foreground">Past date — replacements are read-only.</p>
                ) : (
                <Dialog open={repOpen && repForm.scheduleId === s.id && repForm.date === date} onOpenChange={setRepOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="hero"
                      onClick={() =>
                        setRepForm({
                          scheduleId: s.id,
                          originalTeacherId: s.teacherId,
                          replacementTeacherId: "",
                          subjectId: "",
                          date,
                          reason: `${leave.leaveType} leave on ${date}`,
                        })
                      }
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Assign Replacement
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card">
                    <DialogHeader>
                      <DialogTitle>Assign Replacement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                      <div className="space-y-2">
                        <Label>Replacement teacher</Label>
                        <Select
                          value={repForm.replacementTeacherId}
                          onValueChange={(v) => {
                            const opts = getTeacherSubjectOptions(v);
                            const defaultId =
                              opts.find(
                                (o) =>
                                  o.id === scheduledSubjectId ||
                                  o.name.toLowerCase() === s.subject.toLowerCase()
                              )?.id ?? opts[0]?.id ?? "";
                            setRepForm({
                              ...repForm,
                              replacementTeacherId: v,
                              subjectId: defaultId,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {freeTeachers.length === 0 ? (
                              <p className="px-2 py-2 text-sm text-muted-foreground">
                                No teachers free at this time.
                              </p>
                            ) : (
                              freeTeachers.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Subject for this period</Label>
                        <Select
                          value={repForm.subjectId}
                          onValueChange={(v) => setRepForm({ ...repForm, subjectId: v })}
                          disabled={!repForm.replacementTeacherId}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                repForm.replacementTeacherId
                                  ? "Select subject"
                                  : "Select a teacher first"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {teacherSubjectOptions.map((sub) => (
                              <SelectItem key={sub.id} value={sub.id}>
                                {sub.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={repForm.date}
                          min={minTodayYmd(leave.startDate)}
                          max={leave.endDate.slice(0, 10)}
                          onChange={(e) => setRepForm({ ...repForm, date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reason</Label>
                        <Textarea
                          value={repForm.reason}
                          onChange={(e) => setRepForm({ ...repForm, reason: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="hero"
                        onClick={async () => {
                          try {
                            await onAssignReplacement(repForm);
                            setRepOpen(false);
                          } catch {
                            /* parent shows toast */
                          }
                        }}
                      >
                        Assign
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                )}
              </div>
            );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Replacement History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Original</TableHead>
                <TableHead>Replacement</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {replacements.map((rep) => (
                <TableRow key={rep.id}>
                  <TableCell>{formatShortDate(rep.date)}</TableCell>
                  <TableCell>{rep.originalTeacherName}</TableCell>
                  <TableCell className="flex items-center gap-1">
                    <UserCheck className="w-4 h-4 text-primary" />
                    {rep.replacementTeacherName}
                  </TableCell>
                  <TableCell className="truncate max-w-[180px]">{rep.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

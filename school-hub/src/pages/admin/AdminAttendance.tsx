import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Search,
  Save,
  Edit,
  MoreHorizontal,
  Calendar as CalendarIcon
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/dashboard/StatCard";
import { useToast } from "@/hooks/use-toast";
import type { Attendance, AttendanceStatus } from "@/models/attendance.model";
import { getAttendanceStatusColor, getAttendanceStatusLabel } from "@/models/attendance.model";
import { staffService } from "@/services/staff.service";
import { classService } from "@/services/class.service";
import { studentService } from "@/services/student.service";
import { attendanceService } from "@/services/attendance.service";
import type { Staff } from "@/models/staff.model";
import type { Class } from "@/models/class.model";
import type { Student } from "@/models/student.model";
import { referenceValueService } from "@/services/reference-value.service";
import { ReferenceValueCategory, getReferenceValuesByCategory, type ReferenceValue } from "@/models/referencevalue.model";
import { AttendanceSchoolCalendarDialog } from "@/components/attendance/AttendanceSchoolCalendarDialog";
import { formatDisplayDate, isPastDateYmd, localDateYmd, shiftYmd } from "@/utils/date";
import { describeApiError } from "@/utils/api-error";

const weekData = [
  { day: "Mon", rate: 96 },
  { day: "Tue", rate: 94 },
  { day: "Wed", rate: 98 },
  { day: "Thu", rate: 95 },
  { day: "Fri", rate: 93 },
];

type StaffSummary = {
  id: string;
  name: string;
  role: string;
  departmentId: string;
  departmentName: string;
  status: string;
};

type StudentSummary = {
  id: string;
  name: string;
  classId: string;
  className: string;
  rollNumber: number;
  status: string;
};

const AdminAttendance = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("students");
  const [selectedDate, setSelectedDate] = useState(() => localDateYmd());
  const isPastDate = isPastDateYmd(selectedDate);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const ensureCanEditSelectedDate = () => {
    if (!isPastDateYmd(selectedDate)) return true;
    toast({
      title: "Past date",
      description: "Attendance cannot be edited for previous days.",
      variant: "destructive",
    });
    return false;
  };
  const [selectedClass, setSelectedClass] = useState("all");
  const [staffMembers, setStaffMembers] = useState<StaffSummary[]>([]);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [studentAttendanceRecords, setStudentAttendanceRecords] = useState<Attendance[]>([]);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Staff attendance state - Initialize with existing data
  const staffAttendance = useMemo(() => {
    const initial: Record<string, AttendanceStatus> = {};
    attendanceRecords.forEach(att => {
      if (att.staffId) {
        initial[att.staffId] = att.status;
      }
    });
    return initial;
  }, [attendanceRecords]);
  const [isMarkAttendanceDialogOpen, setIsMarkAttendanceDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffSummary | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>("present");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [remarks, setRemarks] = useState("");
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const [staffDepartmentFilter, setStaffDepartmentFilter] = useState("all");

  // Student attendance state
  const studentAttendance = useMemo(() => {
    const initial: Record<string, AttendanceStatus> = {};
    studentAttendanceRecords.forEach(att => {
      if (att.studentId) {
        initial[att.studentId] = att.status;
      }
    });
    return initial;
  }, [studentAttendanceRecords]);
  const [isMarkStudentAttendanceDialogOpen, setIsMarkStudentAttendanceDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [studentAttendanceStatus, setStudentAttendanceStatus] = useState<AttendanceStatus>("present");
  const [studentRemarks, setStudentRemarks] = useState("");
  const [studentSearchTerm, setStudentSearchTerm] = useState("");

  const attendanceStatusOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.ATTENDANCE_STATUS),
    [referenceValues]
  );

  const getAttendanceStatusName = (status?: AttendanceStatus) => {
    if (!status) return "";
    return attendanceStatusOptions.find(option => option.code === status)?.name || getAttendanceStatusLabel(status);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [staff, refs, attendanceRefs] = await Promise.all([
          staffService.getAll(),
          referenceValueService.getByCategory(ReferenceValueCategory.DEPARTMENT),
          referenceValueService.getByCategory(ReferenceValueCategory.ATTENDANCE_STATUS),
        ]);

        const departmentMap = new Map(
          getReferenceValuesByCategory(refs, ReferenceValueCategory.DEPARTMENT).map((d) => [d.id, d.name])
        );

        setReferenceValues([...refs, ...attendanceRefs]);
        setStaffMembers(staff.map((s: Staff) => ({
          id: s.id,
          name: s.fullName || `${s.firstName || ""} ${s.lastName || ""}`.trim() || s.email,
          role: s.role,
          departmentId: s.department,
          departmentName: departmentMap.get(s.department) || s.department,
          status: s.status,
        })));
      } catch (error) {
        toast({
          title: "Failed to load staff",
          description: "Please try again.",
          variant: "destructive",
        });
      }

      try {
        const attendance = await attendanceService.getByTypeAndDate("staff", selectedDate);
        setAttendanceRecords(attendance);
      } catch (error) {
        setAttendanceRecords([]);
        toast({
          title: "Failed to load attendance",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDate, toast]);

  useEffect(() => {
    const loadStudentData = async () => {
      setLoading(true);
      try {
        const [classData, studentData] = await Promise.all([
          classService.getAll(),
          selectedClass === "all" ? studentService.getAll() : studentService.getByClass(selectedClass),
        ]);
        setClasses(classData);
        setStudents(studentData.map((s: Student) => ({
          id: s.id,
          name: s.fullName || `${s.firstName || ""} ${s.lastName || ""}`.trim(),
          classId: s.classId || "",
          className: s.className || "",
          rollNumber: s.rollNumber || 0,
          status: s.status,
        })));
      } catch (error) {
        toast({
          title: "Failed to load students",
          description: "Please try again.",
          variant: "destructive",
        });
      }

      try {
        const attendance = await attendanceService.getByTypeAndDate(
          "student",
          selectedDate,
          selectedClass === "all" ? undefined : selectedClass
        );
        setStudentAttendanceRecords(attendance);
      } catch (error) {
        setStudentAttendanceRecords([]);
        toast({
          title: "Failed to load student attendance",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, [selectedDate, selectedClass, toast]);


  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      student.className.toLowerCase().includes(studentSearchTerm.toLowerCase());
    const matchesClass = selectedClass === "all" || student.classId === selectedClass;
    return matchesSearch && matchesClass && student.status === "active";
  });

  const studentPresent = filteredStudents.filter(s => studentAttendance[s.id] === "present").length;
  const studentAbsent = filteredStudents.filter(s => studentAttendance[s.id] === "absent").length;
  const studentLate = filteredStudents.filter(s => studentAttendance[s.id] === "late").length;
  const studentExcused = filteredStudents.filter(s => studentAttendance[s.id] === "excused").length;
  const studentHalfDay = filteredStudents.filter(s => studentAttendance[s.id] === "half_day").length;
  const totalStudents = filteredStudents.length;
  const overallRate = totalStudents > 0 ? Math.round((studentPresent / totalStudents) * 100) : 0;

  // Staff attendance calculations
  const staffPresent = Object.values(staffAttendance).filter(s => s === "present").length;
  const staffAbsent = Object.values(staffAttendance).filter(s => s === "absent").length;
  const staffLate = Object.values(staffAttendance).filter(s => s === "late").length;
  const staffExcused = Object.values(staffAttendance).filter(s => s === "excused").length;
  const staffHalfDay = Object.values(staffAttendance).filter(s => s === "half_day").length;
  const totalStaff = staffMembers.filter(s => s.status === "active").length;
  const staffAttendanceRate = totalStaff > 0 ? Math.round((staffPresent / totalStaff) * 100) : 0;

  const classAttendanceData = useMemo(() => {
    const map = new Map<string, { classId: string; className: string; present: number; absent: number; late: number; total: number }>();
    students.filter(s => s.status === "active").forEach(student => {
      const key = student.classId || "unassigned";
      if (!map.has(key)) {
        map.set(key, {
          classId: key,
          className: student.className || "Unassigned",
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
        });
      }
      const entry = map.get(key)!;
      entry.total += 1;
      const status = studentAttendance[student.id];
      if (status === "present") entry.present += 1;
      if (status === "absent") entry.absent += 1;
      if (status === "late") entry.late += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.className.localeCompare(b.className));
  }, [students, studentAttendance]);

  // Filter staff
  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch = 
      staff.name.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
      staff.departmentName.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
      staff.role.toLowerCase().includes(staffSearchTerm.toLowerCase());
    const matchesDepartment = staffDepartmentFilter === "all" || staff.departmentId === staffDepartmentFilter;
    return matchesSearch && matchesDepartment && staff.status === "active";
  });

  const departments = Array.from(new Set(staffMembers.map(s => s.departmentId)));

  const handleMarkStaffAttendance = (staff: StaffSummary) => {
    if (!ensureCanEditSelectedDate()) return;
    setSelectedStaff(staff);
    const existingStatus = staffAttendance[staff.id] || "present";
    setAttendanceStatus(existingStatus);
    const existingRecord = attendanceRecords.find(a => a.staffId === staff.id && a.date === selectedDate);
    setCheckInTime(existingRecord?.checkInTime || "");
    setCheckOutTime(existingRecord?.checkOutTime || "");
    setRemarks(existingRecord?.remarks || "");
    setIsMarkAttendanceDialogOpen(true);
  };

  const handleSaveStaffAttendance = async () => {
    if (!selectedStaff || !ensureCanEditSelectedDate()) return;
    const existingRecord = attendanceRecords.find(a => a.staffId === selectedStaff.id && a.date === selectedDate);

    setLoading(true);
    try {
      const saved = await attendanceService.save({
        id: existingRecord?.id || "",
        type: "staff",
        date: selectedDate,
        staffId: selectedStaff.id,
        staffName: selectedStaff.name,
        status: attendanceStatus,
        checkInTime: attendanceStatus === "absent" ? "" : checkInTime,
        checkOutTime: attendanceStatus === "absent" ? "" : checkOutTime,
        remarks: remarks,
      });

      setAttendanceRecords(prev => {
        const next = prev.filter(a => a.id !== saved.id);
        return [...next, saved];
      });

      toast({
        title: "Attendance Marked",
        description: `${selectedStaff.name}'s attendance has been marked as ${getAttendanceStatusName(attendanceStatus)}.`,
      });

      setIsMarkAttendanceDialogOpen(false);
      setSelectedStaff(null);
      setCheckInTime("");
      setCheckOutTime("");
      setRemarks("");
    } catch (error) {
      toast({
        title: "Save failed",
        description: describeApiError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkStudentAttendance = (student: StudentSummary) => {
    if (!ensureCanEditSelectedDate()) return;
    setSelectedStudent(student);
    const existingRecord = studentAttendanceRecords.find(a => a.studentId === student.id && a.date === selectedDate);
    setStudentAttendanceStatus(existingRecord?.status || "present");
    setStudentRemarks(existingRecord?.remarks || "");
    setIsMarkStudentAttendanceDialogOpen(true);
  };

  const handleSaveStudentAttendance = async () => {
    if (!selectedStudent || !ensureCanEditSelectedDate()) return;

    setLoading(true);
    try {
      const existingRecord = studentAttendanceRecords.find(
        a => a.studentId === selectedStudent.id && a.date === selectedDate
      );

      const saved = await attendanceService.save({
        id: existingRecord?.id || "",
        type: "student",
        date: selectedDate,
        classId: selectedStudent.classId,
        className: selectedStudent.className,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        status: studentAttendanceStatus,
        remarks: studentRemarks || "",
      });

      setStudentAttendanceRecords(prev => {
        const updated = prev.filter(a => !(a.studentId === saved.studentId && a.date === saved.date));
        return [...updated, saved];
      });

      toast({
        title: "Attendance Marked",
        description: `${selectedStudent.name}'s attendance has been marked as ${getAttendanceStatusName(saved.status)}.`,
      });

      setIsMarkStudentAttendanceDialogOpen(false);
      setSelectedStudent(null);
      setStudentRemarks("");
    } catch (error) {
      toast({
        title: "Failed to save attendance",
        description: describeApiError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMarkStudentAttendance = async (studentId: string, status: AttendanceStatus) => {
    if (!ensureCanEditSelectedDate()) return;
    setLoading(true);
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) throw new Error("Student not found.");

      const existingRecord = studentAttendanceRecords.find(
        a => a.studentId === studentId && a.date === selectedDate
      );

      const saved = await attendanceService.save({
        id: existingRecord?.id || "",
        type: "student",
        date: selectedDate,
        classId: student.classId,
        className: student.className,
        studentId: student.id,
        studentName: student.name,
        status,
        remarks: status === "absent" ? "Marked absent by admin" : "",
      });

      setStudentAttendanceRecords(prev => {
        const updated = prev.filter(a => !(a.studentId === saved.studentId && a.date === saved.date));
        return [...updated, saved];
      });

      toast({
        title: "Attendance Updated",
        description: `${student.name}'s attendance has been marked as ${getAttendanceStatusName(status)}.`,
      });
    } catch (error) {
      toast({
        title: "Failed to quick mark attendance",
        description: describeApiError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMarkStaffAttendance = async (staffId: string, status: AttendanceStatus) => {
    if (!ensureCanEditSelectedDate()) return;
    const staff = staffMembers.find(s => s.id === staffId);
    if (!staff) return;
    const existingRecord = attendanceRecords.find(a => a.staffId === staffId && a.date === selectedDate);

    setLoading(true);
    try {
      const saved = await attendanceService.save({
        id: existingRecord?.id || "",
        type: "staff",
        date: selectedDate,
        staffId: staffId,
        staffName: staff.name,
        status: status,
        checkInTime: status === "absent" ? "" : existingRecord?.checkInTime || "",
        checkOutTime: status === "absent" ? "" : existingRecord?.checkOutTime || "",
        remarks: existingRecord?.remarks || "",
      });

      setAttendanceRecords(prev => {
        const next = prev.filter(a => a.id !== saved.id);
        return [...next, saved];
      });

      toast({
        title: "Attendance Updated",
        description: `${staff.name}'s attendance has been marked as ${getAttendanceStatusName(status)}.`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: describeApiError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Attendance Management</h1>
            <p className="text-muted-foreground mt-1">Monitor and manage student and staff attendance</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDate(shiftYmd(selectedDate, -1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="px-4 py-2 h-auto font-medium"
              onClick={() => setIsCalendarOpen(true)}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              {formatDisplayDate(selectedDate)}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDate(shiftYmd(selectedDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <AttendanceSchoolCalendarDialog
          open={isCalendarOpen}
          onOpenChange={setIsCalendarOpen}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {isPastDate ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            Viewing a previous day — attendance is read-only. Select today or a future date to make changes.
          </p>
        ) : null}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="students">
              <Users className="w-4 h-4 mr-2" />
              Student Attendance
            </TabsTrigger>
            <TabsTrigger value="staff">
              <Users className="w-4 h-4 mr-2" />
              Staff Attendance
            </TabsTrigger>
          </TabsList>

          {/* Student Attendance Tab */}
          <TabsContent value="students" className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Present Today" 
            value={studentPresent.toString()} 
            icon={<CheckCircle className="w-6 h-6" />}
            color="primary"
          />
          <StatCard 
            title="Absent Today" 
            value={studentAbsent.toString()} 
            icon={<XCircle className="w-6 h-6" />}
            color="accent"
          />
          <StatCard 
            title="Late Today" 
            value={studentLate.toString()} 
            icon={<Clock className="w-6 h-6" />}
            color="secondary"
          />
          <StatCard 
            title="Overall Rate" 
            value={`${overallRate}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            trend={{ value: 2, isPositive: true }}
            color="purple"
          />
        </div>

        {/* Weekly Overview */}
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="font-display">This Week's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-4 h-48">
              {weekData.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-muted rounded-t-lg relative" style={{ height: '140px' }}>
                    <div 
                      className="absolute bottom-0 w-full gradient-primary rounded-t-lg transition-all"
                      style={{ height: `${day.rate}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">{day.rate}%</span>
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filter */}
        <Card className="shadow-lg border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name || `${classItem.grade}-${classItem.section}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search students..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance by class */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {classAttendanceData.map((item) => {
            const rate = item.total > 0 ? Math.round((item.present / item.total) * 100) : 0;
            return (
              <Card key={item.classId} className="shadow-lg border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-foreground">{item.className}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rate >= 95 ? "bg-green-100 text-green-700" :
                      rate >= 90 ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {rate}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Present
                      </span>
                      <span className="font-medium">{item.present}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        Absent
                      </span>
                      <span className="font-medium">{item.absent}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        Late
                      </span>
                      <span className="font-medium">{item.late}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full gradient-primary rounded-full"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Student Attendance Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Student Attendance - {selectedDate}</CardTitle>
                <CardDescription>
                  Mark and manage student attendance for today
                </CardDescription>
              </div>
              <Button
                disabled={isPastDate}
                onClick={() => {
                if (!ensureCanEditSelectedDate()) return;
                Promise.all(
                  filteredStudents.map(s =>
                    attendanceService.save({
                      id: studentAttendanceRecords.find(a => a.studentId === s.id && a.date === selectedDate)?.id || "",
                      type: "student",
                      date: selectedDate,
                      classId: s.classId,
                      className: s.className,
                      studentId: s.id,
                      studentName: s.name,
                      status: "present",
                    })
                  )
                ).then(saved => {
                  setStudentAttendanceRecords(prev => {
                    const without = prev.filter(a => a.date !== selectedDate || a.type !== "student");
                    return [...without, ...saved];
                  });
                  toast({
                    title: "Attendance Marked",
                    description: "All students marked as present.",
                  });
                });
              }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark All Present
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No students found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => {
                    const status = studentAttendance[student.id] || null;
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.className}</TableCell>
                        <TableCell>{student.rollNumber || "-"}</TableCell>
                        <TableCell>
                          {status ? (
                            <Badge className={getAttendanceStatusColor(status)}>
                              {getAttendanceStatusName(status)}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not Marked</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" disabled={isPastDate}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleMarkStudentAttendance(student)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Mark Attendance
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickMarkStudentAttendance(student.id, "present")}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Present
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickMarkStudentAttendance(student.id, "absent")}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Mark Absent
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickMarkStudentAttendance(student.id, "late")}>
                                <Clock className="w-4 h-4 mr-2" />
                                Mark Late
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickMarkStudentAttendance(student.id, "excused")}>
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                Mark Excused
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Staff Attendance Tab */}
          <TabsContent value="staff" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard 
                title="Present Today" 
                value={staffPresent.toString()} 
                icon={<CheckCircle className="w-6 h-6" />}
                color="primary"
              />
              <StatCard 
                title="Absent Today" 
                value={staffAbsent.toString()} 
                icon={<XCircle className="w-6 h-6" />}
                color="accent"
              />
              <StatCard 
                title="Late Today" 
                value={staffLate.toString()} 
                icon={<Clock className="w-6 h-6" />}
                color="secondary"
              />
              <StatCard 
                title="Excused" 
                value={staffExcused.toString()} 
                icon={<CalendarIcon className="w-6 h-6" />}
                color="purple"
              />
              <StatCard 
                title="Attendance Rate" 
                value={`${staffAttendanceRate}%`}
                icon={<TrendingUp className="w-6 h-6" />}
                color="purple"
              />
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search staff by name, role, or department..."
                      value={staffSearchTerm}
                      onChange={(e) => setStaffSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={staffDepartmentFilter} onValueChange={setStaffDepartmentFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {staffMembers.find(s => s.departmentId === dept)?.departmentName || dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Staff Attendance Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Staff Attendance - {selectedDate}</CardTitle>
                    <CardDescription>
                      Mark and manage staff attendance for today
                    </CardDescription>
                  </div>
                  <Button
                    disabled={isPastDate}
                    onClick={() => {
                    if (!ensureCanEditSelectedDate()) return;
                    const allPresent: Record<string, AttendanceStatus> = {};
                    filteredStaff.forEach(s => {
                      allPresent[s.id] = "present";
                    });
                    Promise.all(
                      filteredStaff.map(s =>
                        attendanceService.save({
                          id: attendanceRecords.find(a => a.staffId === s.id && a.date === selectedDate)?.id || "",
                          type: "staff",
                          date: selectedDate,
                          staffId: s.id,
                          staffName: s.name,
                          status: "present",
                        })
                      )
                    ).then(saved => {
                      setAttendanceRecords(prev => {
                        const without = prev.filter(a => a.date !== selectedDate || a.type !== "staff");
                        return [...without, ...saved];
                      });
                      toast({
                        title: "Attendance Marked",
                        description: "All staff marked as present.",
                      });
                    });
                  }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark All Present
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No staff members found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStaff.map((staff) => {
                        const status = staffAttendance[staff.id] || null;
                        const attendanceRecord = attendanceRecords.find(
                          a => a.staffId === staff.id && a.date === selectedDate
                        );
                        
                        return (
                          <TableRow key={staff.id}>
                            <TableCell className="font-medium">{staff.name}</TableCell>
                            <TableCell>{staff.role}</TableCell>
                            <TableCell>{staff.departmentName}</TableCell>
                            <TableCell>
                              {status ? (
                                <Badge className={getAttendanceStatusColor(status)}>
                                  {getAttendanceStatusName(status)}
                                </Badge>
                              ) : (
                                <Badge variant="outline">Not Marked</Badge>
                              )}
                            </TableCell>
                            <TableCell>{attendanceRecord?.checkInTime || "-"}</TableCell>
                            <TableCell>{attendanceRecord?.checkOutTime || "-"}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" disabled={isPastDate}>
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleMarkStaffAttendance(staff)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Mark Attendance
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleQuickMarkStaffAttendance(staff.id, "present")}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark Present
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleQuickMarkStaffAttendance(staff.id, "absent")}>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Mark Absent
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleQuickMarkStaffAttendance(staff.id, "late")}>
                                    <Clock className="w-4 h-4 mr-2" />
                                    Mark Late
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleQuickMarkStaffAttendance(staff.id, "excused")}>
                                    <CalendarIcon className="w-4 h-4 mr-2" />
                                    Mark Excused
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Mark Student Attendance Dialog */}
        <Dialog open={isMarkStudentAttendanceDialogOpen} onOpenChange={setIsMarkStudentAttendanceDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Mark Student Attendance</DialogTitle>
              <DialogDescription>
                Record attendance for {selectedStudent?.name} on {selectedDate}
              </DialogDescription>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Student</Label>
                  <p className="text-sm font-medium">
                    {selectedStudent.name} - {selectedStudent.className}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentStatus">Attendance Status *</Label>
                  <Select
                    value={studentAttendanceStatus}
                    onValueChange={(value) => setStudentAttendanceStatus(value as AttendanceStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {attendanceStatusOptions.length === 0 ? (
                        <SelectItem value="no-status">No statuses found</SelectItem>
                      ) : (
                        attendanceStatusOptions.map((option) => (
                          <SelectItem key={option.id} value={option.code}>
                            {option.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentRemarks">Remarks (Optional)</Label>
                  <Input
                    id="studentRemarks"
                    value={studentRemarks}
                    onChange={(e) => setStudentRemarks(e.target.value)}
                    placeholder="Add any remarks or notes..."
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMarkStudentAttendanceDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveStudentAttendance}>
                <Save className="w-4 h-4 mr-2" />
                Save Attendance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Mark Staff Attendance Dialog */}
        <Dialog open={isMarkAttendanceDialogOpen} onOpenChange={setIsMarkAttendanceDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Mark Staff Attendance</DialogTitle>
              <DialogDescription>
                Record attendance for {selectedStaff?.name} on {selectedDate}
              </DialogDescription>
            </DialogHeader>
            {selectedStaff && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Staff</Label>
                  <p className="text-sm font-medium">{selectedStaff.name} - {selectedStaff.role}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Attendance Status *</Label>
                  <Select
                    value={attendanceStatus}
                    onValueChange={(value) => setAttendanceStatus(value as AttendanceStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {attendanceStatusOptions.length === 0 ? (
                        <SelectItem value="no-status">No statuses found</SelectItem>
                      ) : (
                        attendanceStatusOptions.map((option) => (
                          <SelectItem key={option.id} value={option.code}>
                            {option.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkIn">Check In Time</Label>
                    <Input
                      id="checkIn"
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      disabled={attendanceStatus === "absent"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOut">Check Out Time</Label>
                    <Input
                      id="checkOut"
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      disabled={attendanceStatus === "absent"}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks (Optional)</Label>
                  <Input
                    id="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add any remarks or notes..."
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMarkAttendanceDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveStaffAttendance}>
                <Save className="w-4 h-4 mr-2" />
                Save Attendance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminAttendance;

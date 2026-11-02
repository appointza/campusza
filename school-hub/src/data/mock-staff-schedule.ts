import type { 
  StaffMember, 
  StaffLeave, 
  ScheduleEntry, 
  StaffReplacement,
  AdminStaffMember 
} from "@/models/staff.model";

export const adminStaffData: AdminStaffMember[] = [
  { id: "STF001", name: "Mr. Johnson", role: "Teacher", department: "Mathematics", email: "johnson@school.com", phone: "+1 234 567 001", status: "active" },
  { id: "STF002", name: "Mrs. Smith", role: "Teacher", department: "English", email: "smith@school.com", phone: "+1 234 567 002", status: "active" },
  { id: "STF003", name: "Dr. Brown", role: "Teacher", department: "Science", email: "brown@school.com", phone: "+1 234 567 003", status: "on-leave" },
  { id: "STF004", name: "Ms. Davis", role: "Teacher", department: "Science", email: "davis@school.com", phone: "+1 234 567 004", status: "active" },
  { id: "STF005", name: "Dr. Wilson", role: "Teacher", department: "Science", email: "wilson@school.com", phone: "+1 234 567 005", status: "active" },
  { id: "STF006", name: "Mr. Anderson", role: "Teacher", department: "Social Studies", email: "anderson@school.com", phone: "+1 234 567 006", status: "active" },
  { id: "STF007", name: "Mrs. Taylor", role: "Teacher", department: "Social Studies", email: "taylor@school.com", phone: "+1 234 567 007", status: "active" },
  { id: "STF008", name: "Mr. Lee", role: "Teacher", department: "Computer Science", email: "lee@school.com", phone: "+1 234 567 008", status: "active" },
  { id: "STF009", name: "Coach Miller", role: "Coach", department: "Physical Education", email: "miller@school.com", phone: "+1 234 567 009", status: "active" },
  { id: "STF010", name: "Ms. Garcia", role: "Teacher", department: "Arts", email: "garcia@school.com", phone: "+1 234 567 010", status: "active" },
  { id: "STF011", name: "Sarah Johnson", role: "Teacher", department: "Mathematics", email: "sarah.j@school.com", phone: "+1 234 567 800", status: "active" },
  { id: "STF012", name: "Robert Williams", role: "Teacher", department: "Science", email: "r.williams@school.com", phone: "+1 234 567 801", status: "active" },
  { id: "STF013", name: "Jennifer Brown", role: "Teacher", department: "English", email: "j.brown@school.com", phone: "+1 234 567 802", status: "active" },
  { id: "STF014", name: "Michael Davis", role: "Administrator", department: "Admin Office", email: "m.davis@school.com", phone: "+1 234 567 803", status: "active" },
  { id: "STF015", name: "Lisa Anderson", role: "Teacher", department: "History", email: "l.anderson@school.com", phone: "+1 234 567 804", status: "on-leave" },
  { id: "STF016", name: "David Wilson", role: "Counselor", department: "Student Affairs", email: "d.wilson@school.com", phone: "+1 234 567 805", status: "active" },
  { id: "STF017", name: "Emily Martinez", role: "Teacher", department: "Art", email: "e.martinez@school.com", phone: "+1 234 567 806", status: "active" },
  { id: "STF018", name: "James Taylor", role: "Coach", department: "Physical Education", email: "j.taylor@school.com", phone: "+1 234 567 807", status: "active" },
];

export const staffMembers: StaffMember[] = [
  { id: "STF001", name: "Mr. Johnson", department: "Mathematics", email: "johnson@school.com", phone: "+1 234 567 001", subjects: ["Mathematics", "Statistics"], status: "active" },
  { id: "STF002", name: "Mrs. Smith", department: "English", email: "smith@school.com", phone: "+1 234 567 002", subjects: ["English", "Literature"], status: "active" },
  { id: "STF003", name: "Dr. Brown", department: "Science", email: "brown@school.com", phone: "+1 234 567 003", subjects: ["Physics", "Chemistry"], status: "on_leave" },
  { id: "STF004", name: "Ms. Davis", department: "Science", email: "davis@school.com", phone: "+1 234 567 004", subjects: ["Chemistry", "Biology"], status: "active" },
  { id: "STF005", name: "Dr. Wilson", department: "Science", email: "wilson@school.com", phone: "+1 234 567 005", subjects: ["Biology"], status: "active" },
  { id: "STF006", name: "Mr. Anderson", department: "Social Studies", email: "anderson@school.com", phone: "+1 234 567 006", subjects: ["History", "Geography"], status: "active" },
  { id: "STF007", name: "Mrs. Taylor", department: "Social Studies", email: "taylor@school.com", phone: "+1 234 567 007", subjects: ["Geography", "Civics"], status: "active" },
  { id: "STF008", name: "Mr. Lee", department: "Computer Science", email: "lee@school.com", phone: "+1 234 567 008", subjects: ["Computer Science"], status: "active" },
  { id: "STF009", name: "Coach Miller", department: "Physical Education", email: "miller@school.com", phone: "+1 234 567 009", subjects: ["Physical Education"], status: "active" },
  { id: "STF010", name: "Ms. Garcia", department: "Arts", email: "garcia@school.com", phone: "+1 234 567 010", subjects: ["Art", "Music"], status: "active" },
];

export const staffLeaves: StaffLeave[] = [
  {
    id: "LV001",
    staffId: "STF003",
    staffName: "Dr. Brown",
    leaveType: "sick",
    startDate: "2025-01-13",
    endDate: "2025-01-17",
    reason: "Medical appointment and recovery",
    status: "approved",
    appliedDate: "2025-01-10",
    approvedBy: "Admin",
    approvedDate: "2025-01-11",
    totalDays: 5,
    organizationId: "ORG001",
    isActive: true,
  },
  {
    id: "LV002",
    staffId: "STF006",
    staffName: "Mr. Anderson",
    leaveType: "personal",
    startDate: "2025-01-20",
    endDate: "2025-01-21",
    reason: "Family function",
    status: "pending",
    appliedDate: "2025-01-12",
    totalDays: 2,
    organizationId: "ORG001",
    isActive: true,
  },
  {
    id: "LV003",
    staffId: "STF002",
    staffName: "Mrs. Smith",
    leaveType: "casual",
    startDate: "2025-01-25",
    endDate: "2025-01-25",
    reason: "Personal work",
    status: "pending",
    appliedDate: "2025-01-14",
    totalDays: 1,
    organizationId: "ORG001",
    isActive: true,
  },
];

export const scheduleData: ScheduleEntry[] = [
  { id: 1, day: "Monday", time: "8:00 AM", subject: "Mathematics", teacher: "Mr. Johnson", teacherId: "STF001", class: "Class 10A", room: "Room 101", color: "bg-primary/20 text-primary" },
  { id: 2, day: "Monday", time: "9:00 AM", subject: "English", teacher: "Mrs. Smith", teacherId: "STF002", class: "Class 10A", room: "Room 102", color: "bg-secondary/20 text-secondary" },
  { id: 3, day: "Monday", time: "10:00 AM", subject: "Physics", teacher: "Dr. Brown", teacherId: "STF003", class: "Class 10B", room: "Lab 1", color: "bg-accent/20 text-accent", replacementTeacher: "Ms. Davis", replacementTeacherId: "STF004", isReplacement: true },
  { id: 4, day: "Tuesday", time: "8:00 AM", subject: "Chemistry", teacher: "Ms. Davis", teacherId: "STF004", class: "Class 10A", room: "Lab 2", color: "bg-cyan-500/20 text-cyan-700" },
  { id: 5, day: "Tuesday", time: "11:00 AM", subject: "Biology", teacher: "Dr. Wilson", teacherId: "STF005", class: "Class 10B", room: "Lab 3", color: "bg-emerald-500/20 text-emerald-700" },
  { id: 6, day: "Wednesday", time: "9:00 AM", subject: "History", teacher: "Mr. Anderson", teacherId: "STF006", class: "Class 10A", room: "Room 103", color: "bg-amber-500/20 text-amber-700" },
  { id: 7, day: "Wednesday", time: "2:00 PM", subject: "Geography", teacher: "Mrs. Taylor", teacherId: "STF007", class: "Class 10B", room: "Room 104", color: "bg-indigo-500/20 text-indigo-700" },
  { id: 8, day: "Thursday", time: "10:00 AM", subject: "Computer Science", teacher: "Mr. Lee", teacherId: "STF008", class: "Class 10A", room: "Computer Lab", color: "bg-pink-500/20 text-pink-700" },
  { id: 9, day: "Friday", time: "8:00 AM", subject: "Physical Education", teacher: "Coach Miller", teacherId: "STF009", class: "Class 10A", room: "Gymnasium", color: "bg-rose-500/20 text-rose-700" },
  { id: 10, day: "Friday", time: "1:00 PM", subject: "Art", teacher: "Ms. Garcia", teacherId: "STF010", class: "Class 10B", room: "Art Room", color: "bg-violet-500/20 text-violet-700" },
  { id: 11, day: "Monday", time: "11:00 AM", subject: "Physics", teacher: "Dr. Brown", teacherId: "STF003", class: "Class 10A", room: "Lab 1", color: "bg-accent/20 text-accent", replacementTeacher: "Ms. Davis", replacementTeacherId: "STF004", isReplacement: true },
  { id: 12, day: "Tuesday", time: "9:00 AM", subject: "Mathematics", teacher: "Mr. Johnson", teacherId: "STF001", class: "Class 10B", room: "Room 101", color: "bg-primary/20 text-primary" },
  { id: 13, day: "Wednesday", time: "10:00 AM", subject: "English", teacher: "Mrs. Smith", teacherId: "STF002", class: "Class 10B", room: "Room 102", color: "bg-secondary/20 text-secondary" },
  { id: 14, day: "Thursday", time: "8:00 AM", subject: "Biology", teacher: "Dr. Wilson", teacherId: "STF005", class: "Class 10A", room: "Lab 3", color: "bg-emerald-500/20 text-emerald-700" },
  { id: 15, day: "Friday", time: "9:00 AM", subject: "Chemistry", teacher: "Ms. Davis", teacherId: "STF004", class: "Class 10A", room: "Lab 2", color: "bg-cyan-500/20 text-cyan-700" },
];

export const staffReplacements: StaffReplacement[] = [
  {
    id: "REP001",
    scheduleId: "3",
    originalTeacherId: "STF003",
    originalTeacherName: "Dr. Brown",
    replacementTeacherId: "STF004",
    replacementTeacherName: "Ms. Davis",
    date: "2025-01-13",
    reason: "Dr. Brown on sick leave",
    assignedBy: "Admin",
    assignedDate: "2025-01-11",
    status: "active",
    organizationId: "ORG001",
    isActive: true,
  },
  {
    id: "REP002",
    scheduleId: "11",
    originalTeacherId: "STF003",
    originalTeacherName: "Dr. Brown",
    replacementTeacherId: "STF004",
    replacementTeacherName: "Ms. Davis",
    date: "2025-01-13",
    reason: "Dr. Brown on sick leave",
    assignedBy: "Admin",
    assignedDate: "2025-01-11",
    status: "active",
    organizationId: "ORG001",
    isActive: true,
  },
];

// Get staff on leave for a specific date
export const getStaffOnLeave = (date: string): StaffLeave[] => {
  return staffLeaves.filter(leave => {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const checkDate = new Date(date);
    return leave.status === "approved" && checkDate >= start && checkDate <= end;
  });
};

// Get available replacement staff for a subject
export const getAvailableReplacements = (subject: string, excludeStaffId: string): StaffMember[] => {
  return staffMembers.filter(staff => 
    staff.id !== excludeStaffId && 
    staff.status === "active" && 
    staff.subjects.includes(subject)
  );
};

// Get staff schedule summary
export const getStaffScheduleSummary = (staffId: string) => {
  const classes = scheduleData.filter(s => s.teacherId === staffId);
  const days = [...new Set(classes.map(c => c.day))];
  return {
    totalClasses: classes.length,
    daysWorking: days.length,
    classes,
    days,
  };
};

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  GraduationCap, 
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  X
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import { classService } from "@/services/class.service";
import { termService } from "@/services/term.service";
import { staffService } from "@/services/staff.service";
import { referenceValueService } from "@/services/reference-value.service";
import { pageService, mapReferenceValuesFromPage } from "@/services/page.service";
import { schoolRoomApi } from "@/services/school-room.service";
import { ClassRoomPicker } from "@/components/QuickAddSchoolRoomDialog";
import axios from "axios";
import type { Class } from "@/models/class.model";
import type { Term } from "@/models/term.model";
import type { Staff } from "@/models/staff.model";
import {
  ReferenceValueCategory,
  getReferenceValuesByCategory,
  resolveReferenceValueId,
  resolveReferenceValueName,
  type ReferenceValue,
} from "@/models/referencevalue.model";
import { cn } from "@/lib/utils";

function termMatchesAcademicYear(
  term: Term,
  academicYearRefId: string,
  values: ReferenceValue[]
): boolean {
  const selected = resolveReferenceValueName(values, ReferenceValueCategory.ACADEMIC_YEAR, academicYearRefId)
    .trim()
    .toLowerCase();
  if (!selected) return false;
  const raw = (term.academicYear || "").trim().toLowerCase();
  const resolved = resolveReferenceValueName(values, ReferenceValueCategory.ACADEMIC_YEAR, term.academicYear)
    .trim()
    .toLowerCase();
  return raw === selected || resolved === selected;
}

type ClassData = {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  students: number;
  room: string;
  schedule: string;
  mentorId?: string;
  mentorName?: string;
  assistantMentorId?: string;
  assistantMentorName?: string;
  grade?: string;
  section?: string;
  capacity?: number;
  academicYear?: string;
  termId?: string;
  status?: string;
};

type StaffOption = {
  id: string;
  name: string;
  department: string;
};

const cleanPersonName = (name?: string) => (name || "").trim().replace(/\s+-\s*$/, "");

function apiErrorMessage(err: unknown, fallback: string): string {
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

const staffOptionLabel = (staff: StaffOption) => {
  const name = cleanPersonName(staff.name) || staff.name;
  const dept = staff.department?.trim();
  return dept ? `${name} - ${dept}` : name;
};

const resolveStaffOptionId = (
  staffId: string | undefined,
  staffName: string | undefined,
  staffOptions: StaffOption[]
): string | undefined => {
  const id = staffId?.trim();
  if (id && staffOptions.some((s) => s.id === id)) return id;
  const normalizedName = cleanPersonName(staffName).toLowerCase();
  if (normalizedName) {
    const byName = staffOptions.find(
      (s) => cleanPersonName(s.name).toLowerCase() === normalizedName
    );
    if (byName) return byName.id;
  }
  return id || undefined;
};

const resolveSchoolRoomId = (
  raw: string | undefined,
  rooms: Array<{ id: string; name: string }>
): string => {
  const v = (raw ?? "").trim();
  if (!v) return "";
  if (rooms.some((r) => r.id === v)) return v;
  const byName = rooms.find((r) => r.name === v);
  return byName?.id ?? v;
};

const mapStaffOptionFromApi = (staff: Staff): StaffOption => {
  const name =
    cleanPersonName(staff.fullName || `${staff.firstName} ${staff.lastName}`.trim()) ||
    staff.fullName ||
    `${staff.firstName} ${staff.lastName}`.trim() ||
    staff.email;
  return {
    id: staff.staffId || staff.id,
    name,
    department: staff.department?.trim() || "",
  };
};

const parseClassPageRow = (item: Record<string, unknown>): ClassData => ({
  id: String(item.id ?? ""),
  name: String(item.name ?? ""),
  subject: String(item.subject ?? "All Subjects"),
  teacher: String(item.teacher ?? item.classteachername ?? item.teachername ?? ""),
  students: Number(item.students ?? item.currentenrollment ?? 0),
  room: String(item.room ?? ""),
  schedule: String(item.schedule ?? "Mon-Fri, 8:00 AM - 3:00 PM"),
  mentorId: String(item.mentorid ?? item.classteacherid ?? ""),
  mentorName: String(item.mentorname ?? item.classteachername ?? ""),
  assistantMentorId: String(item.assistantmentorid ?? ""),
  assistantMentorName: String(item.assistantmentorname ?? ""),
  grade: String(item.grade ?? ""),
  section: String(item.section ?? ""),
  capacity: Number(item.capacity ?? 0),
  academicYear: String(item.academicyear ?? ""),
  termId: String(item.termid ?? ""),
  status: String(item.status ?? ""),
});

const colorVariants = [
  "from-primary to-primary/70",
  "from-secondary to-secondary/70",
  "from-accent to-accent/70",
  "from-purple to-purple/70",
];

type Student = {
  id: string;
  name: string;
  email: string;
  phone: string;
  rollNumber: number;
  status: string;
};

// Mock student data for each class
const getStudentsForClass = (classId: string): Student[] => {
  const allStudents: Record<string, Student[]> = {
    "CLS001": [
      { id: "STU001", name: "John Smith", email: "john.smith@school.com", phone: "+1 234 567 890", rollNumber: 1, status: "active" },
      { id: "STU002", name: "Emma Johnson", email: "emma.j@school.com", phone: "+1 234 567 891", rollNumber: 2, status: "active" },
      { id: "STU003", name: "Michael Brown", email: "m.brown@school.com", phone: "+1 234 567 892", rollNumber: 3, status: "active" },
      { id: "STU004", name: "Sarah Davis", email: "sarah.d@school.com", phone: "+1 234 567 893", rollNumber: 4, status: "active" },
      { id: "STU005", name: "James Wilson", email: "j.wilson@school.com", phone: "+1 234 567 894", rollNumber: 5, status: "active" },
    ],
    "CLS002": [
      { id: "STU006", name: "Emily Taylor", email: "emily.t@school.com", phone: "+1 234 567 895", rollNumber: 1, status: "active" },
      { id: "STU007", name: "David Anderson", email: "d.anderson@school.com", phone: "+1 234 567 896", rollNumber: 2, status: "active" },
      { id: "STU008", name: "Olivia Martinez", email: "o.martinez@school.com", phone: "+1 234 567 897", rollNumber: 3, status: "active" },
    ],
    "CLS003": [
      { id: "STU009", name: "William Garcia", email: "w.garcia@school.com", phone: "+1 234 567 898", rollNumber: 1, status: "active" },
      { id: "STU010", name: "Sophia Rodriguez", email: "s.rodriguez@school.com", phone: "+1 234 567 899", rollNumber: 2, status: "active" },
    ],
  };
  return allStudents[classId] || [];
};

const AdminClasses = () => {
  const { toast } = useToast();
  const [classesData, setClassesData] = useState<ClassData[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [schoolRooms, setSchoolRooms] = useState<Array<{ id: string; name: string }>>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewStudentsDialogOpen, setIsViewStudentsDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [savingClassId, setSavingClassId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<ClassData | null>(null);
  const [addFormData, setAddFormData] = useState<Partial<ClassData>>({
    grade: "",
    section: "",
    academicYear: "",
    termId: "",
    room: "",
    capacity: 30,
  });

  const reloadSchoolRooms = useCallback(async () => {
    try {
      const rooms = await schoolRoomApi.select(true);
      const loaded = rooms
        .filter((r) => r.isActive !== false)
        .map((r) => ({ id: r.id, name: r.name }));
      setSchoolRooms(loaded);
      return loaded;
    } catch {
      setSchoolRooms([]);
      return [];
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const page = await pageService.getAdminClassesPage();
        const refs = mapReferenceValuesFromPage(
          Array.isArray(page.referencevalues) ? page.referencevalues : []
        ) as ReferenceValue[];

        let staffList: StaffOption[] = (Array.isArray(page.staffoptions) ? page.staffoptions : []).map(
          (row) => {
            const item = row as Record<string, unknown>;
            return {
              id: String(item.id ?? ""),
              name: cleanPersonName(String(item.name ?? "")) || String(item.name ?? ""),
              department: String(item.department ?? "").trim(),
            };
          }
        );
        try {
          const staffRows = await staffService.getAll();
          if (staffRows.length > 0) {
            staffList = staffRows.map((s) => mapStaffOptionFromApi(s));
          }
        } catch {
          /* keep page staff options */
        }

        let loadedRooms: Array<{ id: string; name: string }> = [];
        try {
          const rooms = await schoolRoomApi.select(true);
          loadedRooms = rooms
            .filter((r) => r.isActive !== false)
            .map((r) => ({ id: r.id, name: r.name }));
          setSchoolRooms(loadedRooms);
        } catch {
          setSchoolRooms([]);
        }

        const normalizeLoadedClass = (raw: ClassData): ClassData => {
          const room = resolveSchoolRoomId(raw.room, loadedRooms);
          const academicYear = resolveReferenceValueId(
            refs,
            ReferenceValueCategory.ACADEMIC_YEAR,
            raw.academicYear
          );
          const grade = resolveReferenceValueId(refs, ReferenceValueCategory.GRADE, raw.grade);
          const section = resolveReferenceValueId(refs, ReferenceValueCategory.CLASS_SECTION, raw.section);
          const mentorId = resolveStaffOptionId(raw.mentorId, raw.mentorName, staffList);
          const assistantMentorId = resolveStaffOptionId(
            raw.assistantMentorId,
            raw.assistantMentorName,
            staffList
          );
          let mentorName = cleanPersonName(raw.mentorName);
          let assistantMentorName = cleanPersonName(raw.assistantMentorName);
          if (mentorId) {
            const staff = staffList.find((s) => s.id === mentorId);
            if (staff) mentorName = cleanPersonName(staff.name) || staff.name;
          }
          if (assistantMentorId) {
            const staff = staffList.find((s) => s.id === assistantMentorId);
            if (staff) assistantMentorName = cleanPersonName(staff.name) || staff.name;
          }
          const teacher =
            cleanPersonName(raw.teacher) || mentorName || "—";
          return {
            ...raw,
            room,
            academicYear,
            grade,
            section,
            mentorId,
            assistantMentorId,
            mentorName: mentorName || undefined,
            assistantMentorName: assistantMentorName || undefined,
            teacher,
            schedule: raw.schedule || "Mon-Fri, 8:00 AM - 3:00 PM",
          };
        };

        setReferenceValues(refs);
        setStaffOptions(staffList);
        setClassesData(
          (Array.isArray(page.classes) ? page.classes : []).map((row) =>
            normalizeLoadedClass(parseClassPageRow(row as Record<string, unknown>))
          )
        );
        setTerms(
          (Array.isArray(page.termoptions) ? page.termoptions : []).map((row) => {
            const item = row as Record<string, unknown>;
            return {
              id: String(item.id ?? ""),
              name: String(item.name ?? ""),
              startDate: String(item.startdate ?? ""),
              endDate: String(item.enddate ?? ""),
              status: "active" as Term["status"],
              academicYear: String(item.academicyearname ?? item.academicyear ?? ""),
              description: "",
            };
          })
        );
      } catch (error) {
        toast({
          title: "Failed to load classes",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const buildClassPayload = (data: ClassData): Partial<Class> => {
    const [gradePart, sectionPart] = (data.name || "").split("-");
    const grade = data.grade || gradePart?.trim() || "";
    const section = data.section || sectionPart?.trim() || "";

    const status = data.status === "inactive" || data.status === "archived" ? data.status : "active";

    return {
      id: data.id,
      name: data.name,
      grade,
      section,
      room: data.room || "",
    capacity: data.capacity ?? 0,
    currentEnrollment: data.students ?? 0,
      classTeacherId: data.mentorId || "",
      classTeacherName:
        cleanPersonName(data.mentorName || data.teacher) || data.teacher || "",
      assistantMentorId: data.assistantMentorId || "",
      assistantMentorName: cleanPersonName(data.assistantMentorName) || "",
    academicYear: getAcademicYearName(data.academicYear || ""),
    termId: data.termId || "",
    status,
    };
  };

  const gradeOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.GRADE),
    [referenceValues]
  );
  const academicYearOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR),
    [referenceValues]
  );
  const sectionOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.CLASS_SECTION),
    [referenceValues]
  );
  const roomOptions = useMemo(
    () => schoolRooms.map((r) => ({ id: r.id, name: r.name, code: r.name })),
    [schoolRooms]
  );

  const academicYearsMatch = useCallback(
    (yearA?: string, yearB?: string) => {
      const a = yearA?.trim();
      const b = yearB?.trim();
      if (!a || !b) return false;
      if (a === b) return true;
      const nameA =
        resolveReferenceValueName(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR, a) || a;
      const nameB =
        resolveReferenceValueName(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR, b) || b;
      return nameA === nameB;
    },
    [referenceValues]
  );

  const classHomeroomOwner = useCallback(
    (roomId: string | undefined, exceptClassId?: string, academicYear?: string) => {
      const id = roomId?.trim();
      const year = academicYear?.trim();
      if (!id || !year) return undefined;
      return classesData.find(
        (c) =>
          c.id !== exceptClassId &&
          c.room?.trim() === id &&
          academicYearsMatch(c.academicYear, year)
      );
    },
    [classesData, academicYearsMatch]
  );
  const filteredTerms = useMemo(() => {
    if (!addFormData.academicYear) return terms;
    return terms.filter((term) =>
      termMatchesAcademicYear(term, addFormData.academicYear, referenceValues)
    );
  }, [terms, addFormData.academicYear, referenceValues]);
  const filteredEditTerms = useMemo(() => {
    if (!editFormData?.academicYear) return terms;
    return terms.filter((term) =>
      termMatchesAcademicYear(term, editFormData.academicYear, referenceValues)
    );
  }, [terms, editFormData?.academicYear, referenceValues]);

  const getGradeName = (value?: string) =>
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.GRADE, value);
  const getAcademicYearName = (value?: string) =>
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR, value);
  const getSectionName = (value?: string) =>
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.CLASS_SECTION, value);
  const getRoomName = (value?: string) => {
    const id = value?.trim() ?? "";
    if (!id) return "";
    const fromMaster = schoolRooms.find((r) => r.id === id)?.name;
    if (fromMaster) return fromMaster;
    return resolveReferenceValueName(referenceValues, ReferenceValueCategory.ROOM_NUMBER, value);
  };

  const displayPersonName = (name: string | undefined, emptyLabel: string) => {
    const cleaned = cleanPersonName(name);
    return cleaned || emptyLabel;
  };

  const normalizeClassRecord = (raw: ClassData): ClassData => {
    const room = resolveSchoolRoomId(raw.room, schoolRooms);
    const academicYear = resolveReferenceValueId(
      referenceValues,
      ReferenceValueCategory.ACADEMIC_YEAR,
      raw.academicYear
    );
    const grade = resolveReferenceValueId(referenceValues, ReferenceValueCategory.GRADE, raw.grade);
    const section = resolveReferenceValueId(
      referenceValues,
      ReferenceValueCategory.CLASS_SECTION,
      raw.section
    );
    const mentorId = resolveStaffOptionId(raw.mentorId, raw.mentorName, staffOptions);
    const assistantMentorId = resolveStaffOptionId(
      raw.assistantMentorId,
      raw.assistantMentorName,
      staffOptions
    );
    let mentorName = cleanPersonName(raw.mentorName);
    let assistantMentorName = cleanPersonName(raw.assistantMentorName);
    if (mentorId) {
      const staff = staffOptions.find((s) => s.id === mentorId);
      if (staff) mentorName = cleanPersonName(staff.name) || staff.name;
    }
    if (assistantMentorId) {
      const staff = staffOptions.find((s) => s.id === assistantMentorId);
      if (staff) assistantMentorName = cleanPersonName(staff.name) || staff.name;
    }
    const teacher = cleanPersonName(raw.teacher) || mentorName || "—";
    return {
      ...raw,
      room,
      academicYear,
      grade,
      section,
      mentorId,
      assistantMentorId,
      mentorName: mentorName || undefined,
      assistantMentorName: assistantMentorName || undefined,
      teacher,
      schedule: raw.schedule || "Mon-Fri, 8:00 AM - 3:00 PM",
    };
  };

  const roomSelectValue = (roomId?: string) => {
    const id = resolveSchoolRoomId(roomId, schoolRooms);
    if (!id) return "none";
    return roomOptions.some((r) => r.id === id) ? id : "none";
  };

  const staffSelectValue = (staffId?: string, staffName?: string) =>
    resolveStaffOptionId(staffId, staffName, staffOptions) || "none";

  const staffNameFromOption = (staff?: StaffOption) =>
    staff ? cleanPersonName(staff.name) || staff.name : undefined;

  const mapClassToUi = (cls: Class): ClassData =>
    normalizeClassRecord({
      id: cls.id,
      name: cls.name,
      subject: "All Subjects",
      teacher: cls.classTeacherName || "",
      students: cls.currentEnrollment || 0,
      room: cls.room || "",
      schedule: "Mon-Fri, 8:00 AM - 3:00 PM",
      mentorId: cls.classTeacherId || undefined,
      mentorName: cls.classTeacherName || undefined,
      assistantMentorId: cls.assistantMentorId || undefined,
      assistantMentorName: cls.assistantMentorName || undefined,
      grade: cls.grade,
      section: cls.section,
      capacity: cls.capacity,
      academicYear: cls.academicYear,
      termId: cls.termId,
      status: cls.status,
    });

  const getTermName = (termId?: string) => {
    if (!termId?.trim()) return "—";
    return terms.find((t) => t.id === termId)?.name || termId;
  };

  const displayRoom = (roomId?: string) => {
    const name = getRoomName(roomId)?.trim();
    return name || "Not set";
  };

  const filteredClasses = classesData.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const prepareEditForm = (cls: ClassData): ClassData => normalizeClassRecord(cls);

  const startEdit = (cls: ClassData) => {
    setEditingClassId(cls.id);
    setEditFormData(prepareEditForm(cls));
  };

  const cancelEdit = () => {
    setEditingClassId(null);
    setEditFormData(null);
  };

  const saveEdit = async (classId: string) => {
    if (!editFormData || editingClassId !== classId) return;
    if (!editFormData.academicYear || !editFormData.termId) {
      toast({
        title: "Missing fields",
        description: "Academic year and term are required.",
        variant: "destructive",
      });
      return;
    }
    const formWithGrade = { ...editFormData };
    if (!formWithGrade.grade || !formWithGrade.section) {
      const [gradePart, sectionPart] = (editFormData.name || "").split("-");
      formWithGrade.grade = formWithGrade.grade || gradePart?.trim() || "";
      formWithGrade.section = formWithGrade.section || sectionPart?.trim() || "";
    }
    if (!formWithGrade.grade || !formWithGrade.section) {
      toast({
        title: "Missing fields",
        description: "Grade and section are required (use class name like 7-A or set grade/section).",
        variant: "destructive",
      });
      return;
    }
    setSavingClassId(classId);
    const roomOwner = classHomeroomOwner(
      formWithGrade.room,
      classId,
      formWithGrade.academicYear
    );
    if (roomOwner) {
      toast({
        title: "Room already in use",
        description: `${getRoomName(formWithGrade.room) || "This room"} is assigned to ${roomOwner.name}. Pick a different room.`,
        variant: "destructive",
      });
      setSavingClassId(null);
      return;
    }
    try {
      const payload = buildClassPayload(formWithGrade);
      const updated = await classService.update(payload);
      const updatedUi = normalizeClassRecord({
        ...mapClassToUi(updated),
        name: formWithGrade.name,
        subject: formWithGrade.subject,
        teacher: formWithGrade.teacher,
        students: formWithGrade.students,
        schedule: formWithGrade.schedule,
        room: formWithGrade.room,
        academicYear: formWithGrade.academicYear,
        termId: formWithGrade.termId,
        mentorId: formWithGrade.mentorId,
        mentorName: formWithGrade.mentorName,
        assistantMentorId: formWithGrade.assistantMentorId,
        assistantMentorName: formWithGrade.assistantMentorName,
        grade: formWithGrade.grade,
        section: formWithGrade.section,
      });
      setClassesData((prev) => prev.map((cls) => (cls.id === classId ? updatedUi : cls)));
      cancelEdit();
      toast({
        title: "Class Updated",
        description: `${updatedUi.name} has been updated successfully.`,
      });
    } catch (err) {
      toast({
        title: "Update failed",
        description: apiErrorMessage(err, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setSavingClassId(null);
    }
  };

  const handleDelete = (cls: ClassData) => {
    setSelectedClass(cls);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedClass) {
      setLoading(true);
      try {
        await classService.delete(selectedClass.id);
        setClassesData(prev => prev.filter(cls => cls.id !== selectedClass.id));
        setIsDeleteDialogOpen(false);
        setSelectedClass(null);
        toast({
          title: "Class Removed",
          description: `${selectedClass.name} has been removed from the system.`,
          variant: "destructive",
        });
      } catch (error) {
        toast({
          title: "Delete failed",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddClass = async () => {
    if (!addFormData.grade || !addFormData.section || !addFormData.academicYear || !addFormData.termId || !addFormData.room || !addFormData.capacity) {
      toast({
        title: "Missing fields",
        description: "Grade, section, academic year, term, room, and capacity are required.",
        variant: "destructive",
      });
      return;
    }

    const gradeName = getGradeName(String(addFormData.grade || ""));
    const sectionName = getSectionName(String(addFormData.section || ""));
    const name = `${gradeName || String(addFormData.grade || "")}-${sectionName || String(addFormData.section || "").toUpperCase()}`;
    const payload: ClassData = {
      id: "",
      name,
      subject: "All Subjects",
      teacher: addFormData.mentorName || "Not Assigned",
      students: 0,
      room: addFormData.room || "",
      schedule: "Mon-Fri, 8:00 AM - 3:00 PM",
      mentorId: addFormData.mentorId,
      mentorName: addFormData.mentorName,
      grade: addFormData.grade || "",
      section: addFormData.section || "",
      capacity: Number(addFormData.capacity),
      academicYear: addFormData.academicYear || "",
      termId: addFormData.termId || "",
      status: "active",
    };

    const roomOwner = classHomeroomOwner(payload.room, undefined, payload.academicYear);
    if (roomOwner) {
      toast({
        title: "Room already in use",
        description: `${getRoomName(payload.room) || "This room"} is assigned to ${roomOwner.name}. Pick a different room.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const created = await classService.create(buildClassPayload(payload));
      const createdUi = mapClassToUi(created);
      setClassesData(prev => [createdUi, ...prev]);
      setIsAddDialogOpen(false);
      setAddFormData({ grade: "", section: "", academicYear: "", termId: "", room: "", capacity: 30 });
      toast({
        title: "Class Added",
        description: `${createdUi.name} has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: "Create failed",
        description: apiErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudents = (cls: ClassData) => {
    setSelectedClass(cls);
    setIsViewStudentsDialogOpen(true);
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-4 sm:space-y-6 min-w-0 max-w-full overflow-x-hidden">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Classes</h1>
            <p className="text-sm text-muted-foreground mt-0.5 sm:mt-1">Manage all classes and sections</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" className="w-full sm:w-auto shrink-0">
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-1.5rem)] max-w-[calc(100vw-1.5rem)] sm:max-w-[500px] max-h-[min(90vh,720px)] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Class</DialogTitle>
                <DialogDescription>
                  Enter the class details below to create a new class.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="academicYear">Academic Year</Label>
                    <Select
                      value={addFormData.academicYear ? String(addFormData.academicYear) : ""}
                      onValueChange={(value) =>
                        setAddFormData({ ...addFormData, academicYear: value, termId: "" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYearOptions.length === 0 ? (
                          <SelectItem value="no-years" disabled>
                            No academic years available
                          </SelectItem>
                        ) : (
                          academicYearOptions.map((year) => (
                            <SelectItem key={year.id} value={year.id}>
                              {year.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="term">Term</Label>
                    <Select
                      value={addFormData.termId ? String(addFormData.termId) : ""}
                      onValueChange={(value) => setAddFormData({ ...addFormData, termId: value })}
                      disabled={!addFormData.academicYear}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTerms.length === 0 ? (
                          <SelectItem value="no-terms" disabled>
                            No terms available
                          </SelectItem>
                        ) : (
                          filteredTerms.map((term) => (
                            <SelectItem key={term.id} value={term.id}>
                              {term.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="grade">Grade</Label>
                    <Select
                      value={addFormData.grade ? String(addFormData.grade) : ""}
                      onValueChange={(value) => setAddFormData({ ...addFormData, grade: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {gradeOptions.length === 0 ? (
                          <SelectItem value="no-grades" disabled>
                            No grades available
                          </SelectItem>
                        ) : (
                          gradeOptions.map((grade) => (
                            <SelectItem key={grade.id} value={grade.id}>
                              {grade.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section">Section</Label>
                    <Select
                      value={addFormData.section ? String(addFormData.section) : ""}
                      onValueChange={(value) => setAddFormData({ ...addFormData, section: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectionOptions.length === 0 ? (
                          <SelectItem value="no-sections" disabled>
                            No sections available
                          </SelectItem>
                        ) : (
                          sectionOptions.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Room</Label>
                  <ClassRoomPicker
                    roomId={addFormData.room}
                    onRoomChange={(room) => setAddFormData({ ...addFormData, room })}
                    roomOptions={roomOptions}
                    selectValue={roomSelectValue}
                    homeroomOwner={classHomeroomOwner}
                    academicYear={addFormData.academicYear}
                    defaultCapacity={addFormData.capacity ?? 30}
                    onRoomListRefresh={reloadSchoolRooms}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Student Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="35"
                    value={addFormData.capacity ?? 30}
                    onChange={(e) => setAddFormData({ ...addFormData, capacity: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mentor">Class Mentor</Label>
                  <Select
                    value={staffSelectValue(addFormData.mentorId, addFormData.mentorName)}
                    onValueChange={(value) => {
                      if (value === "none") {
                        setAddFormData({ ...addFormData, mentorId: undefined, mentorName: undefined });
                      } else {
                        const selected = staffOptions.find((staff) => staff.id === value);
                        const mentorName = staffNameFromOption(selected);
                        setAddFormData({
                          ...addFormData,
                          mentorId: value,
                          mentorName,
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mentor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Mentor</SelectItem>
                      {staffOptions.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staffOptionLabel(staff)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Assign a staff member as the class mentor/class teacher
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assistant-mentor">Assistant Mentor</Label>
                  <Select
                    value={staffSelectValue(addFormData.assistantMentorId, addFormData.assistantMentorName)}
                    onValueChange={(value) => {
                      if (value === "none") {
                        setAddFormData({ ...addFormData, assistantMentorId: undefined, assistantMentorName: undefined });
                      } else {
                        const selected = staffOptions.find((staff) => staff.id === value);
                        setAddFormData({
                          ...addFormData,
                          assistantMentorId: value,
                          assistantMentorName: staffNameFromOption(selected),
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assistant mentor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Assistant Mentor</SelectItem>
                      {staffOptions.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staffOptionLabel(staff)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Assign a staff member as the assistant class mentor
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button variant="hero" onClick={handleAddClass} disabled={loading}>
                  {loading ? "Adding..." : "Add Class"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="shadow-sm border-border/50">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Classes grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 min-w-0">
          {filteredClasses.map((cls, index) => {
            const isEditing = editingClassId === cls.id && editFormData !== null;
            const saving = savingClassId === cls.id;
            const form = isEditing ? editFormData : null;
            const yearLabel =
              getAcademicYearName(cls.academicYear) || cls.academicYear || "—";

            return (
              <Card
                key={cls.id}
                className={cn(
                  "shadow-sm border-border/50 overflow-hidden hover:shadow-md transition-shadow min-w-0",
                  isEditing && "ring-2 ring-primary/40 border-primary/30 col-span-1 sm:col-span-full"
                )}
              >
                <div className={`h-1.5 bg-gradient-to-r ${colorVariants[index % colorVariants.length]}`} />
                <CardContent className="pt-3 pb-3 px-3 sm:px-6 min-w-0">
                  <div
                    className={cn(
                      "flex gap-2 min-w-0",
                      isEditing ? "flex-col sm:flex-row sm:items-start sm:justify-between" : "items-start justify-between"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      {isEditing && form ? (
                        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-2 w-full min-w-0">
                          <div className="space-y-1 flex-1 min-w-0 w-full">
                            <Label htmlFor={`${cls.id}-name`} className="text-xs">
                              Class Name
                            </Label>
                            <Input
                              id={`${cls.id}-name`}
                              className="h-8"
                              value={form.name}
                              onChange={(e) => setEditFormData({ ...form, name: e.target.value })}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground pb-2 truncate max-w-[12rem]" title={cls.id}>
                            ID …{cls.id.slice(-8)}
                          </p>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-base font-display font-semibold text-foreground truncate" title={cls.name}>
                            {cls.name}
                          </h3>
                          <p
                            className="text-[10px] sm:text-[11px] text-muted-foreground line-clamp-2 leading-snug"
                            title={`${yearLabel} · ${getTermName(cls.termId)} · ${cls.students} students`}
                          >
                            {yearLabel} · {getTermName(cls.termId)} · {cls.students} students
                          </p>
                        </>
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex gap-1.5 shrink-0",
                        isEditing ? "w-full sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none" : "justify-end"
                      )}
                    >
                      {isEditing ? (
                        <>
                          <Button variant="outline" size="sm" className="h-8" onClick={cancelEdit} disabled={saving}>
                            Cancel
                          </Button>
                          <Button variant="hero" size="sm" className="h-8" onClick={() => saveEdit(cls.id)} disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Edit ${cls.name}`}
                            onClick={() => startEdit(cls)}
                            disabled={!!editingClassId}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            aria-label={`Delete ${cls.name}`}
                            onClick={() => handleDelete(cls)}
                            disabled={!!editingClassId}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditing && form ? (
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 border-t border-border/50 pt-3 w-full min-w-0 max-w-full lg:max-w-5xl">
                      <div className="space-y-1.5 min-w-0">
                        <Label className="text-xs">Academic Year</Label>
                        <Select
                          value={form.academicYear || ""}
                          onValueChange={(value) =>
                            setEditFormData({ ...form, academicYear: value, termId: "" })
                          }
                        >
                          <SelectTrigger className="h-9 w-full min-w-0">
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            {academicYearOptions.map((year) => (
                              <SelectItem key={year.id} value={year.id}>
                                {year.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <Label className="text-xs">Term</Label>
                        <Select
                          value={form.termId || ""}
                          onValueChange={(value) => setEditFormData({ ...form, termId: value })}
                          disabled={!form.academicYear}
                        >
                          <SelectTrigger className="h-9 w-full min-w-0">
                            <SelectValue placeholder="Select term" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredEditTerms.length === 0 ? (
                              <SelectItem value="no-terms" disabled>
                                No terms for this year
                              </SelectItem>
                            ) : (
                              filteredEditTerms.map((term) => (
                                <SelectItem key={term.id} value={term.id}>
                                  {term.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 min-w-0 sm:col-span-2 lg:col-span-1">
                        <Label htmlFor={`${cls.id}-subject`} className="text-xs">
                          Subject
                        </Label>
                        <Input
                          id={`${cls.id}-subject`}
                          className="h-9 min-w-0"
                          value={form.subject}
                          onChange={(e) => setEditFormData({ ...form, subject: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5 min-w-0 sm:col-span-2 lg:col-span-1">
                        <Label htmlFor={`${cls.id}-teacher`} className="text-xs">
                          Teacher
                        </Label>
                        <Input
                          id={`${cls.id}-teacher`}
                          className="h-9 min-w-0"
                          value={form.teacher}
                          onChange={(e) => setEditFormData({ ...form, teacher: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <Label className="text-xs">Room</Label>
                        <ClassRoomPicker
                          roomId={form.room}
                          onRoomChange={(room) => setEditFormData({ ...form, room })}
                          roomOptions={roomOptions}
                          selectValue={roomSelectValue}
                          homeroomOwner={classHomeroomOwner}
                          exceptClassId={cls.id}
                          academicYear={form.academicYear}
                          defaultCapacity={form.capacity ?? 30}
                          onRoomListRefresh={reloadSchoolRooms}
                          triggerClassName="h-9 w-full min-w-0 flex-1"
                        />
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <Label htmlFor={`${cls.id}-students`} className="text-xs">
                          Number of Students
                        </Label>
                        <Input
                          id={`${cls.id}-students`}
                          className="h-9 min-w-0"
                          type="number"
                          value={form.students}
                          onChange={(e) =>
                            setEditFormData({ ...form, students: parseInt(e.target.value, 10) || 0 })
                          }
                        />
                      </div>
                      <div className="space-y-1.5 min-w-0 sm:col-span-2">
                        <Label htmlFor={`${cls.id}-schedule`} className="text-xs">
                          Schedule
                        </Label>
                        <Input
                          id={`${cls.id}-schedule`}
                          className="h-9 min-w-0"
                          value={form.schedule}
                          onChange={(e) => setEditFormData({ ...form, schedule: e.target.value })}
                          placeholder="Mon-Fri, 8:00 AM - 3:00 PM"
                        />
                      </div>
                      <div className="space-y-1.5 min-w-0 sm:col-span-2 lg:col-span-1">
                        <Label className="text-xs">Class Mentor</Label>
                        <Select
                          value={staffSelectValue(form.mentorId, form.mentorName)}
                          onValueChange={(value) => {
                            if (value === "none") {
                              setEditFormData({
                                ...form,
                                mentorId: undefined,
                                mentorName: undefined,
                              });
                            } else {
                              const selectedStaff = staffOptions.find((s) => s.id === value);
                              const mentorName = staffNameFromOption(selectedStaff);
                              setEditFormData({
                                ...form,
                                mentorId: value,
                                mentorName,
                                teacher: mentorName || form.teacher,
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="h-9 w-full min-w-0">
                            <SelectValue placeholder="Select mentor" />
                          </SelectTrigger>
                          <SelectContent className="max-w-[min(100vw-2rem,24rem)]">
                            <SelectItem value="none">No Mentor</SelectItem>
                            {staffOptions.map((staff) => (
                              <SelectItem key={staff.id} value={staff.id}>
                                {staffOptionLabel(staff)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 min-w-0 sm:col-span-2 lg:col-span-1">
                        <Label className="text-xs">Assistant Mentor</Label>
                        <Select
                          value={staffSelectValue(form.assistantMentorId, form.assistantMentorName)}
                          onValueChange={(value) => {
                            if (value === "none") {
                              setEditFormData({
                                ...form,
                                assistantMentorId: undefined,
                                assistantMentorName: undefined,
                              });
                            } else {
                              const selectedStaff = staffOptions.find((s) => s.id === value);
                              setEditFormData({
                                ...form,
                                assistantMentorId: value,
                                assistantMentorName: staffNameFromOption(selectedStaff),
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="h-9 w-full min-w-0">
                            <SelectValue placeholder="Select assistant mentor" />
                          </SelectTrigger>
                          <SelectContent className="max-w-[min(100vw-2rem,24rem)]">
                            <SelectItem value="none">No Assistant Mentor</SelectItem>
                            {staffOptions.map((staff) => (
                              <SelectItem key={staff.id} value={staff.id}>
                                {staffOptionLabel(staff)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <dl className="mt-2 grid grid-cols-1 min-[360px]:grid-cols-2 gap-x-2 gap-y-1.5 text-xs border-t border-border/50 pt-2 min-w-0">
                      <div className="min-w-0 col-span-2">
                        <dt className="text-muted-foreground">Subject</dt>
                        <dd className="font-medium truncate">{cls.subject || "All Subjects"}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-muted-foreground">Teacher</dt>
                        <dd className="font-medium truncate" title={displayPersonName(cls.teacher, "—")}>
                          {displayPersonName(cls.teacher, "—")}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-muted-foreground">Room</dt>
                        <dd className="font-medium truncate">{displayRoom(cls.room)}</dd>
                      </div>
                      <div className="min-w-0 col-span-2">
                        <dt className="text-muted-foreground">Schedule</dt>
                        <dd className="font-medium truncate" title={cls.schedule || "—"}>
                          {cls.schedule || "—"}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-muted-foreground">Mentor</dt>
                        <dd className="font-medium truncate" title={displayPersonName(cls.mentorName, "No Mentor")}>
                          {displayPersonName(cls.mentorName, "No Mentor")}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-muted-foreground">Asst. mentor</dt>
                        <dd
                          className="font-medium truncate"
                          title={displayPersonName(cls.assistantMentorName, "No Assistant Mentor")}
                        >
                          {displayPersonName(cls.assistantMentorName, "No Assistant Mentor")}
                        </dd>
                      </div>
                    </dl>
                  )}

                  {!isEditing ? (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <Button
                        variant="outline"
                        className="w-full h-8 text-xs"
                        size="sm"
                        onClick={() => handleViewStudents(cls)}
                        disabled={!!editingClassId}
                      >
                        <Users className="w-3.5 h-3.5 mr-1.5" />
                        View Students
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* View Students Full Screen - Only Right Side */}
        {isViewStudentsDialogOpen && selectedClass && (
          <div className="fixed top-0 left-0 right-0 bottom-0 z-50 bg-background lg:left-64">
            <div className="flex flex-col h-full">
              {/* Header */}
              <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border shadow-sm">
                <div className="flex items-center justify-between min-h-16 px-4 sm:px-6 py-3 sm:py-4 gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsViewStudentsDialogOpen(false)}
                      className="shrink-0"
                    >
                      <Eye className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Back</span>
                    </Button>
                    <div className="h-6 w-px bg-border hidden sm:block" />
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg sm:text-xl font-display font-bold text-foreground truncate">
                        Students in {selectedClass.name}
                      </h1>
                      <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                        View all students enrolled in this class
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-muted-foreground">Total Students</p>
                      <p className="text-2xl font-bold">{getStudentsForClass(selectedClass.id).length}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsViewStudentsDialogOpen(false)}
                      className="shrink-0"
                    >
                      <span className="hidden sm:inline">Close</span>
                      <X className="w-4 h-4 sm:hidden" />
                    </Button>
                  </div>
                </div>
              </header>

              {/* Content */}
              <main className="flex-1 overflow-y-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                  {/* Class Info Card */}
                  <Card className="shadow-lg border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                          {selectedClass.name.split("-")[1]}
                        </div>
                        <div className="flex-1 grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
                          <div>
                            <p className="text-sm text-muted-foreground">Class Name</p>
                            <p className="font-semibold">{selectedClass.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Academic Year</p>
                            <p className="font-semibold">
                              {getAcademicYearName(selectedClass.academicYear) ||
                                selectedClass.academicYear ||
                                "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Term</p>
                            <p className="font-semibold">{getTermName(selectedClass.termId)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Subject</p>
                            <p className="font-semibold">{selectedClass.subject || "All Subjects"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Teacher</p>
                            <p className="font-semibold">{displayPersonName(selectedClass.teacher, "—")}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Room</p>
                            <p className="font-semibold">{displayRoom(selectedClass.room)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Students</p>
                            <p className="font-semibold">{selectedClass.students}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Schedule</p>
                            <p className="font-semibold">{selectedClass.schedule || "—"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Class Mentor</p>
                            <p className="font-semibold">
                              {displayPersonName(selectedClass.mentorName, "No Mentor")}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Assistant Mentor</p>
                            <p className="font-semibold">
                              {displayPersonName(selectedClass.assistantMentorName, "No Assistant Mentor")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Students Table */}
                  {getStudentsForClass(selectedClass.id).length > 0 ? (
                    <Card className="shadow-lg border-border/50">
                      <CardHeader>
                        <CardTitle className="font-display">
                          Students List ({getStudentsForClass(selectedClass.id).length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[80px]">Roll #</TableHead>
                                <TableHead>Student ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {getStudentsForClass(selectedClass.id).map((student) => (
                                <TableRow key={student.id}>
                                  <TableCell className="font-medium">{student.rollNumber}</TableCell>
                                  <TableCell className="font-medium">{student.id}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                                        {student.name.charAt(0)}
                                      </div>
                                      <span className="font-medium">{student.name}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-4 h-4 text-muted-foreground" />
                                      <span>{student.email}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4 text-muted-foreground" />
                                      <span>{student.phone}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      student.status === "active" 
                                        ? "bg-green-100 text-green-700" 
                                        : "bg-muted text-muted-foreground"
                                    }`}>
                                      {student.status}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="shadow-lg border-border/50">
                      <CardContent className="py-16">
                        <div className="text-center">
                          <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Students Enrolled</h3>
                          <p className="text-muted-foreground">
                            No students are currently enrolled in this class.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </main>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently remove{" "}
                <span className="font-semibold">{selectedClass?.name}</span> from the class list.
                All associated data will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminClasses;

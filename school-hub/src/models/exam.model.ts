export interface ExamSeries {
  id?: string;
  organizationId?: string;
  termId?: string;
  academicYear?: string;
  name?: string;
  examTypeRefId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  instructions?: string;
}

export interface ExamSession {
  id?: string;
  organizationId?: string;
  examSeriesId?: string;
  subjectId?: string;
  examDate?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  maxMarks?: number;
  passingMarks?: number;
  instructions?: string;
  status?: string;
  classIds?: string[];
}

import type { SchoolRoom } from '@/models/school-room.model';

/** Same as SchoolRoom — one room master for class, timetable, and exams. */
export type ExamRoom = SchoolRoom;

export interface ExamSessionRoomAllocation {
  examRoomId: string;
  allocatedCapacity: number;
  roomName?: string;
  roomCapacity?: number;
}

export interface ExamSeatAllocationRow {
  id: string;
  examRoomId: string;
  roomName: string;
  studentEnrollmentId: string;
  studentName: string;
  className: string;
  seatLabel: string;
  allocationSource: string;
  isLocked: boolean;
}

export interface ExamGenerateSeatsResult {
  totalstudents: number;
  allocatedstudents: number;
  unallocatedstudents: number;
  errors?: string[];
}

export interface ExamInvigilatorRow {
  id: string;
  examRoomId: string;
  roomName: string;
  staffId: string;
  staffName: string;
  role: string;
}

export interface ExamValidationResult {
  errors: string[];
  isvalid?: boolean;
}

export type ExamMarkAttendance = 'Pending' | 'Present' | 'Absent' | 'Excused' | 'Exempt';

export interface ExamMarkRegisterSessionColumn {
  sessionid: string;
  subjectid: string;
  subjectname: string;
  maxmarks: number;
  passingmarks: number;
  examdate: string;
}

export interface ExamMarkRegisterCellOut {
  sessionid: string;
  enrollmentid: string;
  marksobtained?: number | null;
  attendancestatus: ExamMarkAttendance;
  remarks?: string;
  updatedat?: string;
  ismissing?: boolean;
}

export interface ExamMarkRegisterStudentRow {
  enrollmentid: string;
  studentid: string;
  rollnumber?: number;
  studentname: string;
  classname: string;
  cells: ExamMarkRegisterCellOut[];
}

export interface ExamMarkRegister {
  examseriesid: string;
  examseriesname: string;
  classid: string;
  classname: string;
  marksstatus: string;
  submittedat?: string;
  submittedby?: string;
  approvedat?: string;
  approvedby?: string;
  sessions: ExamMarkRegisterSessionColumn[];
  students: ExamMarkRegisterStudentRow[];
}

export interface ExamStudentResults {
  examseriesid: string;
  examseriesname: string;
  studentid: string;
  studentname: string;
  classid: string;
  classname: string;
  published: boolean;
  subjects: {
    sessionid: string;
    subjectid: string;
    subjectname: string;
    maxmarks: number;
    passingmarks: number;
    marksobtained?: number | null;
    attendancestatus: string;
    passed?: boolean | null;
  }[];
  totalobtained?: number | null;
  totalmax?: number | null;
  percentage?: number | null;
}

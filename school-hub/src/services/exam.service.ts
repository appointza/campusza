import apiClient, { ActionRes } from './api.service';
import { staffService } from './staff.service';
import type { ExamSeries, ExamSession, ExamValidationResult, ExamMarkRegister, ExamStudentResults } from '@/models/exam.model';

function orgId() {
  return staffService.getOrganizationId();
}

function email() {
  return staffService.getSessionEmail();
}

function mapSeriesFromServer(data: Record<string, unknown>): ExamSeries {
  return {
    id: String(data.id ?? ''),
    organizationId: String(data.organizationid ?? data.organization_id ?? ''),
    termId: String(data.termid ?? data.term_id ?? ''),
    academicYear: String(data.academicyear ?? data.academic_year ?? ''),
    name: String(data.name ?? ''),
    examTypeRefId: String(data.examtyperefid ?? data.exam_type_ref_id ?? ''),
    startDate: String(data.startdate ?? data.start_date ?? '').slice(0, 10),
    endDate: String(data.enddate ?? data.end_date ?? '').slice(0, 10),
    status: String(data.status ?? ''),
    instructions: String(data.instructions ?? ''),
  };
}

function mapSeriesToServer(series: Partial<ExamSeries>): Record<string, unknown> {
  return {
    id: series.id || '',
    organizationid: series.organizationId || orgId(),
    termid: series.termId || '',
    academicyear: series.academicYear || '',
    name: series.name || '',
    examtyperefid: series.examTypeRefId || '',
    startdate: series.startDate || '',
    enddate: series.endDate || '',
    status: series.status || '',
    instructions: series.instructions || '',
  };
}

function mapSessionFromServer(data: Record<string, unknown>): ExamSession {
  const classIdsRaw = data.classids ?? data.classIds;
  const classIds = Array.isArray(classIdsRaw) ? classIdsRaw.map((c) => String(c)) : [];
  return {
    id: String(data.id ?? ''),
    organizationId: String(data.organizationid ?? ''),
    examSeriesId: String(data.examseriesid ?? data.exam_series_id ?? ''),
    subjectId: String(data.subjectid ?? data.subject_id ?? ''),
    examDate: String(data.examdate ?? data.exam_date ?? '').slice(0, 10),
    startTime: String(data.starttime ?? data.start_time ?? '').slice(0, 8),
    endTime: String(data.endtime ?? data.end_time ?? '').slice(0, 8),
    durationMinutes: Number(data.durationminutes ?? data.duration_minutes ?? 0),
    maxMarks: Number(data.maxmarks ?? data.max_marks ?? 0),
    passingMarks: Number(data.passingmarks ?? data.passing_marks ?? 0),
    instructions: String(data.instructions ?? ''),
    status: String(data.status ?? ''),
    classIds,
  };
}

function mapSessionToServer(session: Partial<ExamSession>): Record<string, unknown> {
  return {
    id: session.id || '',
    organizationid: session.organizationId || orgId(),
    examseriesid: session.examSeriesId || '',
    subjectid: session.subjectId || '',
    examdate: session.examDate || '',
    starttime: session.startTime || '09:00:00',
    endtime: session.endTime || '10:00:00',
    durationminutes: session.durationMinutes ?? 60,
    maxmarks: session.maxMarks ?? 100,
    passingmarks: session.passingMarks ?? 35,
    instructions: session.instructions || '',
    status: session.status || 'Draft',
    classids: session.classIds || [],
  };
}

class ExamService {
  private seriesEndpoint = '/campusza/ExamSeries';
  private sessionEndpoint = '/campusza/ExamSession';

  async selectSeries(filters?: { termId?: string; status?: string }): Promise<ExamSeries[]> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>[]>>(
      `${this.seriesEndpoint}/Select`,
      {
        item: {
          organizationid: orgId(),
          termid: filters?.termId || '',
          status: filters?.status || '',
        },
      }
    );
    return (response.data.item || []).map((row) => mapSeriesFromServer(row as Record<string, unknown>));
  }

  async saveSeries(series: Partial<ExamSeries>): Promise<ExamSeries> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
      `${this.seriesEndpoint}/Save`,
      {
        item: {
          series: mapSeriesToServer(series),
          organizationid: orgId(),
          email: email(),
        },
      }
    );
    return mapSeriesFromServer(response.data.item as Record<string, unknown>);
  }

  async scheduleSeries(id: string): Promise<ExamSeries> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
      `${this.seriesEndpoint}/Schedule`,
      { item: { id, organizationid: orgId(), email: email() } }
    );
    return mapSeriesFromServer(response.data.item as Record<string, unknown>);
  }

  async publishSeries(id: string): Promise<ExamSeries> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
      `${this.seriesEndpoint}/Publish`,
      { item: { id, organizationid: orgId(), email: email() } }
    );
    return mapSeriesFromServer(response.data.item as Record<string, unknown>);
  }

  async cancelSeries(id: string, reason: string): Promise<ExamSeries> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
      `${this.seriesEndpoint}/Cancel`,
      { item: { id, organizationid: orgId(), email: email(), reason } }
    );
    return mapSeriesFromServer(response.data.item as Record<string, unknown>);
  }

  async validateSeries(id: string): Promise<ExamValidationResult> {
    const response = await apiClient.post<ActionRes<ExamValidationResult>>(
      `${this.seriesEndpoint}/Validate`,
      { item: { id, organizationid: orgId(), email: email() } }
    );
    return response.data.item;
  }

  async selectSessions(examSeriesId: string): Promise<ExamSession[]> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>[]>>(
      `${this.sessionEndpoint}/Select`,
      {
        item: { organizationid: orgId(), examseriesid: examSeriesId },
      }
    );
    return (response.data.item || []).map((row) => mapSessionFromServer(row as Record<string, unknown>));
  }

  async saveSession(session: Partial<ExamSession>): Promise<ExamSession> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
      `${this.sessionEndpoint}/Save`,
      {
        item: {
          session: mapSessionToServer(session),
          organizationid: orgId(),
          email: email(),
        },
      }
    );
    return mapSessionFromServer(response.data.item as Record<string, unknown>);
  }

  async validateSession(session: Partial<ExamSession>): Promise<ExamValidationResult> {
    const response = await apiClient.post<ActionRes<ExamValidationResult>>(
      `${this.sessionEndpoint}/Validate`,
      {
        item: {
          session: mapSessionToServer(session),
          organizationid: orgId(),
          email: email(),
        },
      }
    );
    return response.data.item;
  }

  async selectSessionRooms(sessionId: string) {
    const response = await apiClient.post<ActionRes<Record<string, unknown>[]>>(`/campusza/ExamSessionRoom/Select`, {
      item: { organizationid: orgId(), examsessionid: sessionId },
    });
    return response.data.item || [];
  }

  async saveSessionRooms(
    sessionId: string,
    rooms: { examroomid: string; allocatedcapacity: number }[],
    opts?: { allowcorrection?: boolean; reason?: string }
  ) {
    const response = await apiClient.post<ActionRes<Record<string, unknown>[]>>(`/campusza/ExamSessionRoom/Save`, {
      item: {
        examsessionid: sessionId,
        rooms,
        organizationid: orgId(),
        email: email(),
        allowcorrection: opts?.allowcorrection ?? false,
        reason: opts?.reason ?? '',
      },
    });
    return response.data.item || [];
  }

  async selectSeats(sessionId: string) {
    const response = await apiClient.post<ActionRes<Record<string, unknown>[]>>(`/campusza/ExamSeating/Select`, {
      item: { organizationid: orgId(), examsessionid: sessionId },
    });
    return response.data.item || [];
  }

  async generateSeats(
    sessionId: string,
    strategy: 'RollNumber' | 'AdmissionNumber',
    opts?: { preservemanual?: boolean; forcereplaceauto?: boolean; allowcorrection?: boolean; reason?: string }
  ) {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(`/campusza/ExamSeating/GenerateSeats`, {
      item: {
        examsessionid: sessionId,
        strategy,
        preservemanual: opts?.preservemanual ?? true,
        forcereplaceauto: opts?.forcereplaceauto ?? false,
        organizationid: orgId(),
        email: email(),
        allowcorrection: opts?.allowcorrection ?? false,
        reason: opts?.reason ?? '',
      },
    });
    return response.data.item;
  }

  async assignSeat(payload: {
    examsessionid: string;
    examroomid: string;
    studentenrollmentid: string;
    seatlabel: string;
    islocked?: boolean;
    replaceexisting?: boolean;
    allowcorrection?: boolean;
    reason?: string;
  }) {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(`/campusza/ExamSeating/AssignSeat`, {
      item: { ...payload, organizationid: orgId(), email: email() },
    });
    return response.data.item;
  }

  async selectInvigilators(sessionId: string) {
    const response = await apiClient.post<ActionRes<Record<string, unknown>[]>>(`/campusza/ExamInvigilator/Select`, {
      item: { organizationid: orgId(), examsessionid: sessionId },
    });
    return response.data.item || [];
  }

  async saveInvigilator(payload: {
    examsessionid: string;
    examroomid: string;
    staffid: string;
    role: string;
  }) {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(`/campusza/ExamInvigilator/Save`, {
      item: {
        invigilator: payload,
        organizationid: orgId(),
        email: email(),
      },
    });
    return response.data.item;
  }

  async deleteInvigilator(id: string) {
    const response = await apiClient.post<ActionRes<boolean>>(`/campusza/ExamInvigilator/Delete`, {
      item: { id, organizationid: orgId(), email: email() },
    });
    return response.data.item;
  }

  private marksEndpoint = '/campusza/ExamMarks';

  async getMarkRegister(examSeriesId: string, classId: string): Promise<ExamMarkRegister> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(`${this.marksEndpoint}/GetRegister`, {
      item: { examseriesid: examSeriesId, classid: classId, organizationid: orgId(), email: email() },
    });
    return mapRegister(response.data.item || {});
  }

  async saveMarkRegister(
    examSeriesId: string,
    classId: string,
    cells: {
      sessionId: string;
      enrollmentId: string;
      marksObtained?: number | null;
      attendanceStatus: string;
      expectedUpdatedAt?: string;
    }[]
  ) {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(`${this.marksEndpoint}/SaveRegister`, {
      item: {
        examseriesid: examSeriesId,
        classid: classId,
        organizationid: orgId(),
        email: email(),
        cells: cells.map((c) => ({
          sessionid: c.sessionId,
          enrollmentid: c.enrollmentId,
          marksobtained: c.marksObtained ?? null,
          attendancestatus: c.attendanceStatus,
          expectedupdatedat: c.expectedUpdatedAt || null,
        })),
      },
    });
    return response.data.item;
  }

  async submitMarkRegister(examSeriesId: string, classId: string) {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(`${this.marksEndpoint}/SubmitRegister`, {
      item: { examseriesid: examSeriesId, classid: classId, organizationid: orgId(), email: email() },
    });
    return mapRegister(response.data.item || {});
  }

  async approveMarkRegister(examSeriesId: string, classId: string) {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(`${this.marksEndpoint}/ApproveRegister`, {
      item: { examseriesid: examSeriesId, classid: classId, organizationid: orgId(), email: email() },
    });
    return mapRegister(response.data.item || {});
  }

  async reopenMarkRegister(examSeriesId: string, classId: string, reason: string) {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(`${this.marksEndpoint}/ReopenRegister`, {
      item: { examseriesid: examSeriesId, classid: classId, organizationid: orgId(), email: email(), reason },
    });
    return mapRegister(response.data.item || {});
  }

  async publishExamResults(examSeriesId: string, remarks?: string) {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(`${this.marksEndpoint}/PublishResults`, {
      item: { examseriesid: examSeriesId, organizationid: orgId(), email: email(), remarks: remarks || '' },
    });
    return response.data.item;
  }

  async getStudentExamResults(examSeriesId: string, studentId: string): Promise<ExamStudentResults> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(`${this.marksEndpoint}/GetStudentResults`, {
      item: { examseriesid: examSeriesId, studentid: studentId, organizationid: orgId(), email: email() },
    });
    const raw = response.data.item || {};
    return {
      examseriesid: String(raw.examseriesid ?? ''),
      examseriesname: String(raw.examseriesname ?? ''),
      studentid: String(raw.studentid ?? ''),
      studentname: String(raw.studentname ?? ''),
      classid: String(raw.classid ?? ''),
      classname: String(raw.classname ?? ''),
      published: Boolean(raw.published),
      subjects: Array.isArray(raw.subjects)
        ? (raw.subjects as Record<string, unknown>[]).map((s) => ({
            sessionid: String(s.sessionid ?? ''),
            subjectid: String(s.subjectid ?? ''),
            subjectname: String(s.subjectname ?? ''),
            maxmarks: Number(s.maxmarks ?? 0),
            passingmarks: Number(s.passingmarks ?? 0),
            marksobtained: s.marksobtained == null ? null : Number(s.marksobtained),
            attendancestatus: String(s.attendancestatus ?? ''),
            passed: s.passed == null ? null : Boolean(s.passed),
          }))
        : [],
      totalobtained: raw.totalobtained == null ? null : Number(raw.totalobtained),
      totalmax: raw.totalmax == null ? null : Number(raw.totalmax),
      percentage: raw.percentage == null ? null : Number(raw.percentage),
    };
  }

  async getHallTicket(sessionId: string, enrollmentId: string) {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(`${this.marksEndpoint}/GetHallTicket`, {
      item: {
        examsessionid: sessionId,
        studentenrollmentid: enrollmentId,
        organizationid: orgId(),
        email: email(),
      },
    });
    return response.data.item as Record<string, unknown>;
  }
}

function mapRegister(raw: Record<string, unknown>): ExamMarkRegister {
  return {
    examseriesid: String(raw.examseriesid ?? ''),
    examseriesname: String(raw.examseriesname ?? ''),
    classid: String(raw.classid ?? ''),
    classname: String(raw.classname ?? ''),
    marksstatus: String(raw.marksstatus ?? 'Draft'),
    submittedat: raw.submittedat ? String(raw.submittedat) : undefined,
    submittedby: String(raw.submittedby ?? ''),
    approvedat: raw.approvedat ? String(raw.approvedat) : undefined,
    approvedby: String(raw.approvedby ?? ''),
    sessions: Array.isArray(raw.sessions)
      ? (raw.sessions as Record<string, unknown>[]).map((s) => ({
          sessionid: String(s.sessionid ?? ''),
          subjectid: String(s.subjectid ?? ''),
          subjectname: String(s.subjectname ?? ''),
          maxmarks: Number(s.maxmarks ?? 0),
          passingmarks: Number(s.passingmarks ?? 0),
          examdate: String(s.examdate ?? ''),
        }))
      : [],
    students: Array.isArray(raw.students)
      ? (raw.students as Record<string, unknown>[]).map((st) => ({
          enrollmentid: String(st.enrollmentid ?? ''),
          studentid: String(st.studentid ?? ''),
          rollnumber: st.rollnumber == null ? undefined : Number(st.rollnumber),
          studentname: String(st.studentname ?? ''),
          classname: String(st.classname ?? ''),
          cells: Array.isArray(st.cells)
            ? (st.cells as Record<string, unknown>[]).map((c) => ({
                sessionid: String(c.sessionid ?? ''),
                enrollmentid: String(c.enrollmentid ?? ''),
                marksobtained: c.marksobtained == null ? null : Number(c.marksobtained),
                attendancestatus: String(c.attendancestatus ?? 'Pending') as ExamMarkRegister['students'][0]['cells'][0]['attendancestatus'],
                remarks: String(c.remarks ?? ''),
                updatedat: c.updatedat ? String(c.updatedat) : undefined,
                ismissing: Boolean(c.ismissing),
              }))
            : [],
        }))
      : [],
  };
}

export const examService = new ExamService();

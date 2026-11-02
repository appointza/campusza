import apiClient, { ActionRes } from './api.service';
import { Student } from '@/models/student.model';
import { staffService } from './staff.service';
import { toDateInputValue } from '@/utils/date';
import {
    defaultExtendedProfile,
    extendedProfileToApi,
    mapExtendedProfileFromApi,
} from '@/models/student-profile.model';

class StudentService {
    private static instance: StudentService;
    private readonly endpoint = '/campusza/student';

    private constructor() { }

    public static getInstance(): StudentService {
        if (!StudentService.instance) {
            StudentService.instance = new StudentService();
        }
        return StudentService.instance;
    }

    private getStoredUser() {
        const raw = localStorage.getItem('campusza_user');
        if (!raw) return null;
        try {
            return JSON.parse(raw) as {
                organizationId?: string;
                organizationid?: string;
                organization_id?: string;
                userId?: string;
                email?: string;
            };
        } catch {
            return null;
        }
    }

    private getOrganizationId(): string {
        return staffService.getOrganizationId();
    }

    private getActor(): string {
        const user = this.getStoredUser();
        return user?.userId || user?.email || 'system';
    }

    // Map server response to UI model
    private mapFromServer(data: any): Student {
        return {
            id: data?.id?.toString() || '',
            studentId: data?.studentid || '',
            firstName: data?.firstname || '',
            lastName: data?.lastname || '',
            fullName: data?.fullname || '',
            email: data?.email || '',
            phone: data?.phone || '',
            dateOfBirth: toDateInputValue(data?.dateofbirth),
            gender: data?.gender || 'other',
            address: {
                street: data?.addressstreet || '',
                city: data?.addresscity || '',
                state: data?.addressstate || '',
                zipCode: data?.addresszipcode || '',
                country: data?.addresscountry || '',
            },
            parentGuardian: {
                name: data?.parentguardianname || '',
                relationship: data?.parentguardianrelationship || 'guardian',
                email: data?.parentguardianemail || '',
                phone: data?.parentguardianphone || '',
                occupation: data?.parentguardianoccupation || '',
            },
            classId: data?.classid || '',
            className: data?.classname || '',
            grade: data?.grade || '',
            section: data?.section || '',
            rollNumber: data?.rollnumber ?? 0,
            admissionDate: toDateInputValue(data?.admissiondate),
            currentAcademicYear: data?.currentacademicyear || '',
            currentSemesterType: data?.currentsemestertype || 'annual',
            currentTermId: data?.currenttermid || undefined,
            currentTermName: data?.currenttermname || undefined,
            status: data?.status || 'active',
            photoUrl: data?.photourl || undefined,
            bloodGroup: data?.bloodgroup || undefined,
            medicalConditions: data?.medicalconditions || undefined,
            emergencyContact: {
                name: data?.emergencycontactname || '',
                relationship: data?.emergencycontactrelationship || '',
                phone: data?.emergencycontactphone || '',
            },
            organizationId: data?.organizationid || '',
            isActive: data?.isactive ?? true,
            loginMobile: data?.loginmobile || undefined,
            extendedProfile: mapExtendedProfileFromApi(
                (() => {
                    if (typeof data?.extendedprofile_json === 'string') {
                        try {
                            return JSON.parse(data.extendedprofile_json || '{}');
                        } catch {
                            return {};
                        }
                    }
                    return data?.extendedprofile ?? data?.extended_profile;
                })()
            ),
            createdAt: data?.createdat || '',
            updatedAt: data?.updatedat || '',
            createdBy: data?.createdby || '',
            updatedBy: data?.updatedby || '',
        };
    }

    private mapToServer(data: Partial<Student>): Record<string, unknown> {
        const actor = this.getActor();
        const organizationId = data.organizationId || this.getOrganizationId();
        const now = new Date().toISOString();

        return {
            id: data.id || '',
            studentid: data.studentId || '',
            firstname: data.firstName || '',
            lastname: data.lastName || '',
            fullname: data.fullName || '',
            email: data.email || '',
            phone: data.phone || '',
            dateofbirth: data.dateOfBirth || '',
            gender: data.gender || 'other',
            addressstreet: data.address?.street || '',
            addresscity: data.address?.city || '',
            addressstate: data.address?.state || '',
            addresszipcode: data.address?.zipCode || '',
            addresscountry: data.address?.country || '',
            parentguardianname: data.parentGuardian?.name || '',
            parentguardianrelationship: data.parentGuardian?.relationship || '',
            parentguardianemail: data.parentGuardian?.email || '',
            parentguardianphone: data.parentGuardian?.phone || '',
            parentguardianoccupation: data.parentGuardian?.occupation || '',
            classid: data.classId || '',
            classname: data.className || '',
            grade: data.grade || '',
            section: data.section || '',
            rollnumber: data.rollNumber ?? 0,
            admissiondate: data.admissionDate || now.split('T')[0],
            currentacademicyear: data.currentAcademicYear || '',
            currentsemestertype: data.currentSemesterType || 'annual',
            currenttermid: data.currentTermId || '',
            currenttermname: data.currentTermName || '',
            status: data.status || 'active',
            photourl: data.photoUrl || '',
            bloodgroup: data.bloodGroup || '',
            medicalconditions: data.medicalConditions || '',
            emergencycontactname: data.emergencyContact?.name || '',
            emergencycontactrelationship: data.emergencyContact?.relationship || '',
            emergencycontactphone: data.emergencyContact?.phone || '',
            organizationid: organizationId,
            isactive: data.isActive ?? true,
            extendedprofile_json: JSON.stringify(
                extendedProfileToApi(data.extendedProfile ?? defaultExtendedProfile())
            ),
            createdat: data.createdAt || now,
            updatedat: data.updatedAt || now,
            createdby: data.createdBy || actor,
            updatedby: data.updatedBy || actor,
        };
    }

    public async getAll(): Promise<Student[]> {
        const response = await apiClient.post<ActionRes<any[]>>(`${this.endpoint}/Select`, {
            item: {
                organizationid: this.getOrganizationId(),
                // Do not filter by students.status — DB often has empty/reference values; is_active is enforced server-side.
                status: '',
            }
        });
        return response.data.item.map((item) => this.mapFromServer(item));
    }

    public async getByClass(classId: string): Promise<Student[]> {
        const response = await apiClient.post<ActionRes<any[]>>(`${this.endpoint}/Select`, {
            item: {
                organizationid: this.getOrganizationId(),
                classid: classId,
                status: '',
            }
        });
        return response.data.item.map((item) => this.mapFromServer(item));
    }

    public async getById(id: string): Promise<Student> {
        const response = await apiClient.post<ActionRes<any[]>>(`${this.endpoint}/Select`, {
            item: {
                id: id,
                organizationid: this.getOrganizationId()
            }
        });
        // Select returns a list, take the first one
        return this.mapFromServer(response.data.item[0]);
    }

    public async create(student: Partial<Student>): Promise<Student> {
        const response = await apiClient.post<ActionRes<any>>(`${this.endpoint}/Save`, {
            item: this.mapToServer(student)
        });
        return this.mapFromServer(response.data.item);
    }

    public async update(student: Partial<Student>): Promise<Student> {
        const response = await apiClient.post<ActionRes<any>>(`${this.endpoint}/Save`, {
            item: this.mapToServer(student)
        });
        return this.mapFromServer(response.data.item);
    }

    /** Public wrappers for enrollment service integration. */
    public parseFromServer(data: unknown): Student {
        return this.mapFromServer(data);
    }

    public toServerPayload(data: Partial<Student>): Record<string, unknown> {
        return this.mapToServer(data);
    }

    public async delete(id: string): Promise<boolean> {
        const response = await apiClient.post<ActionRes<boolean>>(`${this.endpoint}/Delete`, {
            item: {
                id: id,
                organizationid: this.getOrganizationId()
            }
        });
        return response.data.item;
    }
}

export const studentService = StudentService.getInstance();

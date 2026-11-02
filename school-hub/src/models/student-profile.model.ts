/** Extra profile fields stored in students.extended_profile (JSON). */

export type StudentCategory = "new_admission" | "transfer" | "scholarship" | "";

export interface ParentContact {
  name: string;
  phone: string;
  email: string;
  occupation: string;
}

export interface StudentTransportInfo {
  required: boolean;
  route: string;
  pickupPoint: string;
  vehicle: string;
  driver: string;
}

export interface StudentFeeInfo {
  plan: string;
  scholarship: string;
  discountPercent: number;
  category: string;
}

export interface StudentLoginInfo {
  parentLoginEnabled: boolean;
  studentLoginEnabled: boolean;
  username: string;
}

export interface StudentExtendedProfile {
  displayName: string;
  addressLine2: string;
  father: ParentContact;
  mother: ParentContact;
  previousSchool: string;
  studentCategory: StudentCategory;
  house: string;
  allergies: string;
  doctorName: string;
  emergencyNotes: string;
  transport: StudentTransportInfo;
  fee: StudentFeeInfo;
  login: StudentLoginInfo;
}

export const defaultParentContact = (): ParentContact => ({
  name: "",
  phone: "",
  email: "",
  occupation: "",
});

export const defaultExtendedProfile = (): StudentExtendedProfile => ({
  displayName: "",
  addressLine2: "",
  father: defaultParentContact(),
  mother: defaultParentContact(),
  previousSchool: "",
  studentCategory: "",
  house: "",
  allergies: "",
  doctorName: "",
  emergencyNotes: "",
  transport: {
    required: false,
    route: "",
    pickupPoint: "",
    vehicle: "",
    driver: "",
  },
  fee: {
    plan: "",
    scholarship: "",
    discountPercent: 0,
    category: "",
  },
  login: {
    parentLoginEnabled: false,
    studentLoginEnabled: false,
    username: "",
  },
});

export function mapExtendedProfileFromApi(raw: unknown): StudentExtendedProfile {
  const base = defaultExtendedProfile();
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Record<string, unknown>;
  const parent = (key: "father" | "mother"): ParentContact => {
    const p = data[key] as Record<string, unknown> | undefined;
    if (!p) return defaultParentContact();
    return {
      name: String(p.name ?? ""),
      phone: String(p.phone ?? ""),
      email: String(p.email ?? ""),
      occupation: String(p.occupation ?? ""),
    };
  };
  const transport = data.transport as Record<string, unknown> | undefined;
  const fee = data.fee as Record<string, unknown> | undefined;
  const login = data.login as Record<string, unknown> | undefined;
  return {
    displayName: String(data.displayName ?? data.displayname ?? ""),
    addressLine2: String(data.addressLine2 ?? data.addressline2 ?? ""),
    father: parent("father"),
    mother: parent("mother"),
    previousSchool: String(data.previousSchool ?? data.previousschool ?? ""),
    studentCategory: (data.studentCategory ?? data.studentcategory ?? "") as StudentCategory,
    house: String(data.house ?? ""),
    allergies: String(data.allergies ?? ""),
    doctorName: String(data.doctorName ?? data.doctorname ?? ""),
    emergencyNotes: String(data.emergencyNotes ?? data.emergencynotes ?? ""),
    transport: {
      required: Boolean(transport?.required),
      route: String(transport?.route ?? ""),
      pickupPoint: String(transport?.pickupPoint ?? transport?.pickuppoint ?? ""),
      vehicle: String(transport?.vehicle ?? ""),
      driver: String(transport?.driver ?? ""),
    },
    fee: {
      plan: String(fee?.plan ?? ""),
      scholarship: String(fee?.scholarship ?? ""),
      discountPercent: Number(fee?.discountPercent ?? fee?.discountpercent ?? 0),
      category: String(fee?.category ?? ""),
    },
    login: {
      parentLoginEnabled: Boolean(login?.parentLoginEnabled ?? login?.parentloginenabled),
      studentLoginEnabled: Boolean(login?.studentLoginEnabled ?? login?.studentloginenabled),
      username: String(login?.username ?? ""),
    },
  };
}

export function extendedProfileToApi(profile: StudentExtendedProfile): Record<string, unknown> {
  return {
    displayname: profile.displayName,
    addressline2: profile.addressLine2,
    father: profile.father,
    mother: profile.mother,
    previousschool: profile.previousSchool,
    studentcategory: profile.studentCategory,
    house: profile.house,
    allergies: profile.allergies,
    doctorname: profile.doctorName,
    emergencynotes: profile.emergencyNotes,
    transport: {
      required: profile.transport.required,
      route: profile.transport.route,
      pickuppoint: profile.transport.pickupPoint,
      vehicle: profile.transport.vehicle,
      driver: profile.transport.driver,
    },
    fee: {
      plan: profile.fee.plan,
      scholarship: profile.fee.scholarship,
      discountpercent: profile.fee.discountPercent,
      category: profile.fee.category,
    },
    login: {
      parentloginenabled: profile.login.parentLoginEnabled,
      studentloginenabled: profile.login.studentLoginEnabled,
      username: profile.login.username,
    },
  };
}

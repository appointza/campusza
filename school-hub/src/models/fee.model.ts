// Fee Model
export type FeeStatus = "paid" | "partial" | "unpaid" | "overdue" | "waived";
export type PaymentMode = "cash" | "card" | "bank_transfer" | "online" | "cheque" | "other";
export type FeeType = "tuition" | "registration" | "library" | "laboratory" | "sports" | "transport" | "hostel" | "other";

export interface FeeStructure {
  id: string;
  name: string;
  termId: string;
  termName: string;
  academicYear: string;
  grade: string; // e.g., "Grade 9", "Grade 10"
  classId?: string; // Optional: specific class
  className?: string;
  feeType: FeeType;
  amount: number;
  currency: string;
  dueDate: string;
  isOptional: boolean;
  description?: string;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface StudentFee {
  id: string;
  studentId: string;
  studentName: string;
  termId: string;
  termName: string;
  academicYear: string;
  feeStructures: FeeStructureItem[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: FeeStatus;
  dueDate: string;
  payments: PaymentRecord[];
  discounts?: FeeDiscount[];
  penalties?: FeePenalty[];
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeeStructureItem {
  feeStructureId: string;
  feeStructureName: string;
  feeType: FeeType;
  amount: number;
  isPaid: boolean;
}

export interface PaymentRecord {
  id: string;
  feeId: string;
  studentId: string;
  amount: number;
  date: string;
  receiptNo: string;
  paymentMode: PaymentMode;
  transactionId?: string;
  bankName?: string;
  chequeNumber?: string;
  remarks?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface FeeDiscount {
  id: string;
  feeId: string;
  type: "percentage" | "fixed";
  value: number; // Percentage or fixed amount
  reason: string;
  approvedBy: string;
  approvedDate: string;
}

export interface FeePenalty {
  id: string;
  feeId: string;
  amount: number;
  reason: string;
  appliedDate: string;
  appliedBy: string;
}

export interface FeePaymentSchedule {
  id: string;
  feeId: string;
  studentId: string;
  installments: PaymentInstallment[];
  totalAmount: number;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInstallment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidAmount: number;
  status: "pending" | "paid" | "overdue" | "partial";
  paidDate?: string;
  paymentId?: string;
}

// Helper functions
export const getFeeStatusColor = (status: FeeStatus): string => {
  switch (status) {
    case "paid": return "bg-green-100 text-green-700";
    case "partial": return "bg-yellow-100 text-yellow-700";
    case "unpaid": return "bg-red-100 text-red-700";
    case "overdue": return "bg-red-200 text-red-800";
    case "waived": return "bg-blue-100 text-blue-700";
    default: return "bg-muted text-muted-foreground";
  }
};

export const getFeeStatusLabel = (status: FeeStatus): string => {
  const labels: Record<FeeStatus, string> = {
    paid: "Paid",
    partial: "Partial",
    unpaid: "Unpaid",
    overdue: "Overdue",
    waived: "Waived",
  };
  return labels[status];
};

export const getPaymentModeLabel = (mode: PaymentMode): string => {
  const labels: Record<PaymentMode, string> = {
    cash: "Cash",
    card: "Card",
    bank_transfer: "Bank Transfer",
    online: "Online Payment",
    cheque: "Cheque",
    other: "Other",
  };
  return labels[mode];
};

export const getFeeTypeLabel = (type: FeeType): string => {
  const labels: Record<FeeType, string> = {
    tuition: "Tuition Fee",
    registration: "Registration Fee",
    library: "Library Fee",
    laboratory: "Laboratory Fee",
    sports: "Sports Fee",
    transport: "Transport Fee",
    hostel: "Hostel Fee",
    other: "Other",
  };
  return labels[type];
};

export const calculateFeeStatus = (
  totalAmount: number,
  paidAmount: number,
  dueDate: string
): FeeStatus => {
  if (paidAmount >= totalAmount) return "paid";
  if (paidAmount > 0) return "partial";
  const today = new Date();
  const due = new Date(dueDate);
  if (today > due) return "overdue";
  return "unpaid";
};


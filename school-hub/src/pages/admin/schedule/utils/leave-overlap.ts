import type { StaffLeave } from "@/models/staff.model";

export function dateRangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const a0 = startA.slice(0, 10);
  const a1 = endA.slice(0, 10);
  const b0 = startB.slice(0, 10);
  const b1 = endB.slice(0, 10);
  if (!a0 || !a1 || !b0 || !b1) return false;
  return a0 <= b1 && a1 >= b0;
}

/** Pending or approved active leave that overlaps the given range (rejected ignored). */
export function findOverlappingLeave(
  staffId: string,
  startDate: string,
  endDate: string,
  leaves: StaffLeave[],
  excludeLeaveId?: string
): StaffLeave | undefined {
  return leaves.find((leave) => {
    if (leave.staffId !== staffId) return false;
    if (excludeLeaveId && leave.id === excludeLeaveId) return false;
    if (leave.status === "rejected") return false;
    if (leave.isActive === false) return false;
    return dateRangesOverlap(startDate, endDate, leave.startDate, leave.endDate);
  });
}

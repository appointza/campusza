import { Navigate, useSearchParams } from "react-router-dom";

/** Attendance is combined with My Classes — keep old URL working. */
const StaffAttendance = () => {
  const [searchParams] = useSearchParams();
  const classId = searchParams.get("classId");
  const target = classId ? `/staff/classes?classId=${encodeURIComponent(classId)}` : "/staff/classes";
  return <Navigate to={target} replace />;
};

export default StaffAttendance;

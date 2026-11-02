import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

/** Homework is managed per class on Classes & attendance. */
const StaffHomework = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const classId = searchParams.get("classId");
    const qs = new URLSearchParams({ tab: "homework" });
    if (classId) qs.set("classId", classId);
    navigate(`/staff/classes?${qs.toString()}`, { replace: true });
  }, [navigate, searchParams]);

  return (
    <DashboardLayout role="staff" userName="Staff Member">
      <p className="text-muted-foreground">Opening homework…</p>
    </DashboardLayout>
  );
};

export default StaffHomework;

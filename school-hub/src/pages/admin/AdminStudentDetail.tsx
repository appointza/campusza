import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { AdminStudentDetailPanel } from "@/components/students/AdminStudentDetailPanel";

const AdminStudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <DashboardLayout role="admin" userName="Admin User">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Student not found.</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/students")}>
            Back to students
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <AdminStudentDetailPanel studentId={id} onBack={() => navigate("/admin/students")} />
    </DashboardLayout>
  );
};

export default AdminStudentDetail;

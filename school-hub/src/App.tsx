import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GuestOnly, RequireAuth, AdminSchoolRouteGuard } from "@/components/auth/RequireAuth";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import ForgotPasswordPage from "./pages/auth/ForgotPassword";
import ResetPasswordPage from "./pages/auth/ResetPassword";
import SetupPasswordPage from "./pages/auth/SetupPassword";
import OrganizationSignup from "./pages/OrganizationSignup";
import AdminOnboarding from "./pages/admin/AdminOnboarding";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPlatformSchools from "./pages/admin/AdminPlatformSchools";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminStudentDetail from "./pages/admin/AdminStudentDetail";
import AdminStudentPromotion from "./pages/admin/AdminStudentPromotion";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminStaffForm from "./pages/admin/AdminStaffForm";
import AdminClasses from "./pages/admin/AdminClasses";
import AdminSchedule from "./pages/admin/AdminSchedule";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminClassConfig from "./pages/admin/AdminClassConfig";
import AdminSchoolCalendar from "./pages/admin/AdminSchoolCalendar";
import AdminSchoolNotifications from "./pages/admin/AdminSchoolNotifications";
import AdminGradePeriods from "./pages/admin/AdminGradePeriods";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffClasses from "./pages/staff/StaffClasses";
import StaffAttendance from "./pages/staff/StaffAttendance";
import StaffSchedule from "./pages/staff/StaffSchedule";
import StaffStudents from "./pages/staff/StaffStudents";
import StaffStudentDetail from "./pages/staff/StaffStudentDetail";
import StaffGrades from "./pages/staff/StaffGrades";
import StaffExamMarks from "./pages/staff/StaffExamMarks";
import StaffDocuments from "./pages/staff/StaffDocuments";
import StaffDocumentStudents from "./pages/staff/StaffDocumentStudents";
import StaffHomework from "./pages/staff/StaffHomework";
import StaffNotifications from "./pages/staff/StaffNotifications";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AdminHomework from "./pages/admin/AdminHomework";
import AdminExams from "./pages/admin/AdminExams";
import AdminExamSeriesDetail from "./pages/admin/AdminExamSeriesDetail";
import AdminExamSessionSeating from "./pages/admin/AdminExamSessionSeating";
import AdminExamMarks from "./pages/admin/AdminExamMarks";
import StudentHomework from "./pages/student/StudentHomework";
import StudentNotifications from "./pages/student/StudentNotifications";
import StudentTimetable from "./pages/student/StudentTimetable";
import StudentExams from "./pages/student/StudentExams";
import StudentExamResults from "./pages/student/StudentExamResults";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signin" element={<GuestOnly><SignIn /></GuestOnly>} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/setup-password" element={<SetupPasswordPage />} />
          <Route path="/register" element={<OrganizationSignup />} />
          {/* Admin — nested under /admin so the auth layout always matches */}
          <Route path="/admin" element={<RequireAuth allowedRoles={["admin", "admin_staff"]} />}>
            <Route element={<AdminSchoolRouteGuard />}>
            <Route index element={<AdminDashboard />} />
            <Route path="platform" element={<AdminPlatformSchools />} />
            <Route path="onboarding" element={<AdminOnboarding />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="students/:id" element={<AdminStudentDetail />} />
            <Route path="promotion" element={<AdminStudentPromotion />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="staff/new" element={<AdminStaffForm mode="create" />} />
            <Route path="staff/:id/edit" element={<AdminStaffForm mode="edit" />} />
            <Route path="classes" element={<AdminClasses />} />
            <Route
              path="terms"
              element={<Navigate to="/admin/settings?tab=references&ref=terms" replace />}
            />
            <Route path="school-calendar" element={<AdminSchoolCalendar />} />
            <Route path="notifications" element={<AdminSchoolNotifications />} />
            <Route path="schedule" element={<AdminSchedule />} />
            <Route path="bell-schedule" element={<AdminGradePeriods />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="homework" element={<AdminHomework />} />
            <Route path="exams" element={<AdminExams />} />
            <Route path="exams/:seriesId" element={<AdminExamSeriesDetail />} />
            <Route path="exams/:seriesId/sessions/:sessionId/seating" element={<AdminExamSessionSeating />} />
            <Route
              path="rooms"
              element={<Navigate to="/admin/settings?tab=references&ref=rooms" replace />}
            />
            <Route
              path="exam-rooms"
              element={<Navigate to="/admin/settings?tab=references&ref=rooms" replace />}
            />
            <Route path="exam-marks" element={<AdminExamMarks />} />
            <Route path="class-config" element={<AdminClassConfig />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="profile" element={<Profile />} />
            </Route>
          </Route>
          {/* Staff — nested under /staff */}
          <Route path="/staff" element={<RequireAuth allowedRoles={["staff"]} />}>
            <Route index element={<StaffDashboard />} />
            <Route path="classes" element={<StaffClasses />} />
            <Route path="attendance" element={<StaffAttendance />} />
            <Route path="homework" element={<StaffHomework />} />
            <Route path="schedule" element={<StaffSchedule />} />
            <Route path="students" element={<StaffStudents />} />
            <Route path="students/:studentId" element={<StaffStudentDetail />} />
            <Route path="grades" element={<StaffGrades />} />
            <Route path="exam-marks" element={<StaffExamMarks />} />
            <Route path="documents" element={<StaffDocuments />} />
            <Route path="documents/:documentId/students" element={<StaffDocumentStudents />} />
            <Route path="notifications" element={<StaffNotifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          {/* Student — nested under /student */}
          <Route path="/student" element={<RequireAuth allowedRoles={["student"]} />}>
            <Route path="homework" element={<StudentHomework />} />
            <Route path="timetable" element={<StudentTimetable />} />
            <Route path="exams" element={<StudentExams />} />
            <Route path="exam-results" element={<StudentExamResults />} />
            <Route path="notifications" element={<StudentNotifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

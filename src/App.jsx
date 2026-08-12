import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import AdminDashboard from "./admindashboard";
import LiveClassroomRoom from "./live-classroom/LiveClassroomRoom";
import TrainerDashboard from "./TrainerDashboard";
import RecordingDashboard from "./RecordingDashboard";
import SessionManagement from "./SessionManagement";
import AccessDenied from "./AccessDenied";
import AttendanceManagement from "./AttendanceManagement";
import MyAttendance from "./MyAttendance";
import AttendanceDashboard from "./AttendanceDashboard";
import StudentDashboard from "./StudentDashboard";
import NotificationDashboard from "./NotificationDashboard";
import UserManagement from "./usermanagement";
import CourseManagement from "./coursemanagement";
import CourseDetails from "./coursedetails";
import BatchManagement from "./batchmanagement";
import AdminLiveSessionMonitor from "./adminlivesessionmonitor";
import ExamManagement from "./exammanagement";
import ExamResultSummary from "./examresultsummary";
import ExamAnalyticsDashboard from "./examanalyticsdashboard";
import StudentExams from "./studentexams";
import TakeExam from "./takeexam";
import AssignmentManagement from "./assignmentmanagement";
import AssignmentSubmissions from "./assignmentsubmissions";
import StudentAssignments from "./studentassignments";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<TrainerDashboard />} />
        <Route path="/live-classroom/:roomId" element={<LiveClassroomRoom />} />
        <Route path="/recordings" element={<RecordingDashboard />} />
        <Route path="/sessions" element={<SessionManagement />} />
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="/attendance" element={<AttendanceManagement />} />
        <Route path="/my-attendance" element={<MyAttendance />} />
        <Route path="/attendance-dashboard" element={<AttendanceDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/notifications" element={<NotificationDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/courses" element={<CourseManagement />} />
        <Route path="/admin/courses/:id" element={<CourseDetails />} />
        <Route path="/admin/batches" element={<BatchManagement />} />
        <Route
          path="/admin/live-sessions"
          element={<AdminLiveSessionMonitor />}
        />
        <Route path="/admin/exams" element={<ExamManagement />} />
        <Route path="/exams/:id/results" element={<ExamResultSummary />} />
        <Route
          path="/exams/:id/analytics"
          element={<ExamAnalyticsDashboard />}
        />
        <Route path="/my-exams" element={<StudentExams />} />
        <Route path="/exams/:id/take" element={<TakeExam />} />
        <Route path="/admin/assignments" element={<AssignmentManagement />} />
        <Route
          path="/admin/assignments/:id/submissions"
          element={<AssignmentSubmissions />}
        />
        <Route path="/my-assignments" element={<StudentAssignments />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

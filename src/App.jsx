import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;

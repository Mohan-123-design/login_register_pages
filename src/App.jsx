import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import DigitalClassroom from './DigitalClassroom';
import TrainerDashboard from './TrainerDashboard';
import RecordingDashboard from './RecordingDashboard';
import SessionManagement from './SessionManagement';
import AccessDenied from './AccessDenied';
import AttendanceManagement from './AttendanceManagement';
import MyAttendance from './MyAttendance';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<TrainerDashboard />} />
        <Route path="/classroom" element={<DigitalClassroom />} />
        <Route path="/recordings" element={<RecordingDashboard />} />
        <Route path="/sessions" element={<SessionManagement />} />
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="/attendance" element={<AttendanceManagement />} />
        <Route path="/my-attendance" element={<MyAttendance />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

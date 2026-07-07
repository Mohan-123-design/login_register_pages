import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import DigitalClassroom from './DigitalClassroom';
import TrainerDashboard from './TrainerDashboard';
import RecordingDashboard from './RecordingDashboard';

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;

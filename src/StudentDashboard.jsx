import "./StudentDashboard.css";
import StudentNotificationPanel from "./StudentNotificationPanel";
import NotificationToast from "./live-classroom/NotificationToast";

function StudentDashboard() {
  var loggedInUser = localStorage.getItem("loggedInUser");

  if (loggedInUser === null) {
    window.location.href = "/access-denied";
    return null;
  }

  var userData = JSON.parse(loggedInUser);
  if (userData.role !== "Student") {
    window.location.href = "/access-denied";
    return null;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2>Welcome back, {userData.firstName}!</h2>
        <p>Student Dashboard</p>
      </header>

      <div className="dashboard-content">
        <StudentNotificationPanel userData={userData} />
      </div>
      <NotificationToast />
    </div>
  );
}

export default StudentDashboard;

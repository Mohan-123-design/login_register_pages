import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./admindashboard.css";

function AdminDashboard() {
  var navigate = useNavigate();
  var loggedInUser = localStorage.getItem("loggedInUser");
  var [stats, setStats] = useState(null);
  var [recentRegistrations, setRecentRegistrations] = useState([]);
  var [recentActivity, setRecentActivity] = useState([]);
  var [isLoading, setIsLoading] = useState(true);
  var [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        var token = localStorage.getItem("token");
        var response = await fetch("/api/admin/dashboard", {
          headers: {
            Authorization: "Bearer " + token,
          },
        });
        if (response.status === 401 || response.status === 403) {
          navigate("/access-denied");
          return;
        }
        var data = await response.json();
        if (data.success) {
          setStats(data.stats);
          setRecentRegistrations(data.recentRegistrations);
          setRecentActivity(data.recentActivity);
        } else {
          setErrorMessage(data.message || "Failed to load dashboard data.");
        }
      } catch (error) {
        console.error("Error fetching admin dashboard:", error);
        setErrorMessage("Server or network error. Is the backend running?");
      } finally {
        setIsLoading(false);
      }
    }
   fetchDashboard();
    var intervalId = setInterval(fetchDashboard, 15000);
    return function () {
      clearInterval(intervalId);
    };
  }, [navigate]);  if (loggedInUser === null) {
    window.location.href = "/access-denied";
    return null;
  }
  var userData = JSON.parse(loggedInUser);
  if (userData.role !== "Admin") {
    window.location.href = "/access-denied";
    return null;
  }

  function goTo(path) {
    navigate(path);
  }

  function formatEventLabel(eventType) {
    var labels = {
      "user:login": " User Login",
      "session:started": " Meeting Started",
      "session:ended": " Meeting Ended",
      "notification:sent": " Notification Sent",
    };
    return labels[eventType] || eventType;
  }

  function formatDate(dateString) {
  if (!dateString) return "-";
    var d = new Date(dateString);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
  }

  var statCardConfig = [
    { key: "totalStudents", label: "Total Students", icon: "🎓" },
    { key: "totalTrainers", label: "Total Trainers", icon: "🧑‍🏫" },
    { key: "totalCourses", label: "Total Courses", icon: "📚" },
    { key: "totalBatches", label: "Total Batches", icon: "🗂️" },
    { key: "activeLiveSessions", label: "Active Live Sessions", icon: "🔴" },
    { key: "completedSessions", label: "Completed Sessions", icon: "✅" },
    { key: "totalExams", label: "Total Exams", icon: "📝" },
    { key: "totalCertificates", label: "Total Certificates", icon: "🏆" },
    { key: "pendingAssignments", label: "Pending Assignments", icon: "⏳" },
  ];

  var chartMax = 1;
  if (stats) {
    var values = [stats.totalStudents, stats.totalTrainers, stats.totalCourses, stats.totalBatches];
    for (var i = 0; i < values.length; i++) {
      if (values[i] > chartMax) chartMax = values[i];
    }
  }

  return (
    <div className="admin-dash-page">
      <div className="admin-dash-header">
        <h1>Admin Dashboard</h1>
        <p className="admin-dash-welcome">
          Welcome , {userData.firstName || "Admin"}
        </p>
      </div>
      {isLoading && (
        <div className="admin-dash-status admin-dash-loading">
          Loading dashboard...
        </div>
      )}
      {!isLoading && errorMessage !== "" && (
        <div className="admin-dash-status admin-dash-error">
          {errorMessage}
        </div>
      )}
      {!isLoading && errorMessage === "" && stats !== null && (
        <>
          <div className="admin-dash-stats-grid">
            {statCardConfig.map(function (card) {
              return (
                <div className="admin-dash-stat-card" key={card.key}>
                  <div className="admin-dash-stat-icon">{card.icon}</div>
                  <div className="admin-dash-stat-label">{card.label}</div>
                  <div className="admin-dash-stat-number">
                    {stats[card.key]}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="admin-dash-section">
            <h2>Quick Actions</h2>
            <div className="admin-dash-actions-row">
              <button className="admin-dash-action-btn" onClick={() => goTo("/sessions")}>
                Manage Sessions
              </button>
              <button className="admin-dash-action-btn" onClick={() => goTo("/attendance")}>
                Manage Attendance
              </button>
              <button className="admin-dash-action-btn" onClick={() => goTo("/notifications")}>
                Send Notification
              </button>
              <button className="admin-dash-action-btn" onClick={() => goTo("/recordings")}>
                View Recordings
              </button>
              <button className="admin-dash-action-btn" onClick={() => goTo("/admin/users")}>
  Manage Users
</button>
<button className="admin-dash-action-btn" onClick={() => goTo("/admin/courses")}>
  Manage Courses
</button>
<button className="admin-dash-action-btn" onClick={() => goTo("/admin/batches")}>
  Manage Batches
</button>
            </div>
          </div>
          <div className="admin-dash-section">
            <h2>Overview Chart</h2>
            <div className="admin-dash-chart-wrap">
              <svg viewBox="0 0 400 200" className="admin-dash-chart-svg">
                {[
                  { label: "Students", value: stats.totalStudents, color: "#3a1dde" },
                  { label: "Trainers", value: stats.totalTrainers, color: "#2166c4" },
                  { label: "Courses", value: stats.totalCourses, color: "#e65100" },
                  { label: "Batches", value: stats.totalBatches, color: "#2e7d32" },
                ].map(function (bar, index) {
                  var barHeight = (bar.value / chartMax) * 140;
                  var x = 40 + index * 90;
                  var y = 170 - barHeight;
                  return (
                    <g key={bar.label}>
                      <rect
                        x={x}
                        y={y}
                        width="50"
                        height={barHeight}
                        fill={bar.color}
                        rx="4"
                      />
                      <text x={x + 25} y="188" textAnchor="middle" fontSize="12">
                        {bar.label}
                      </text>
                      <text x={x + 25} y={y - 6} textAnchor="middle" fontSize="12" fontWeight="bold">
                        {bar.value}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
          <div className="admin-dash-section">
            <h2>Recent Activity</h2>
            <table className="admin-dash-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Actor</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.length === 0 && (
                  <tr>
                    <td colSpan="3" className="admin-dash-empty-row">
                      No recent activity yet.
                    </td>
                  </tr>
                )}
                {recentActivity.map(function (activity) {
                  return (
                    <tr key={activity._id}>
                      <td>{formatEventLabel(activity.eventType)}</td>
                    <td>{activity.actorName}</td>
                      <td>{formatDate(activity.timestamp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="admin-dash-section">
            <h2>Recent Registrations</h2>
            <table className="admin-dash-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {recentRegistrations.length === 0 && (
                  <tr>
                    <td colSpan="4" className="admin-dash-empty-row">
                      No recent registrations.
                    </td>
                  </tr>
                )}
                {recentRegistrations.map(function (user, index) {
                  return (
                    <tr key={index}>
                      <td>{user.firstName + " " + user.lastName}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{formatDate(user.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
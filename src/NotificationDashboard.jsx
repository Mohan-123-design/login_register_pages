import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./NotificationDashboard.css";
import NotificationFilters from "./NotificationFilters";
import NotificationList from "./NotificationList";
import CreateNotificationModal from "./CreateNotificationModal";
import NotificationToast from "./live-classroom/NotificationToast";

function NotificationDashboard() {
  var loggedInUser = localStorage.getItem("loggedInUser");
  if (loggedInUser === null) {
    window.location.href = "/access-denied";
    return null;
  }

  var userData = JSON.parse(loggedInUser);
  if (userData.role !== "Trainer" && userData.role !== "Admin") {
    window.location.href = "/access-denied";
    return null;
  }

  var navigate = useNavigate();
  var [notifications, setNotifications] = useState([]);
  var [stats, setStats] = useState({
    total: 0,
    totalHighPriority: 0,
    totalUnread: 0,
    recentNotifications: [],
  });
  var [isLoading, setIsLoading] = useState(true);
  var [errorMsg, setErrorMsg] = useState("");
  var [page, setPage] = useState(1);
  var limit = 10;
  var [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  var [filters, setFilters] = useState({
    title: "",
    priority: "",
    recipientType: "",
    isRead: "",
    fromDate: "",
    toDate: "",
    status: "",
  });

  function fetchNotifications() {
    setIsLoading(true);
    setErrorMsg("");
    var token = localStorage.getItem("token");
    var queryParams = [];
    queryParams.push("page=" + page);
    queryParams.push("limit=" + limit);
    if (filters.title !== "")
      queryParams.push("title=" + encodeURIComponent(filters.title));
    if (filters.priority !== "")
      queryParams.push("priority=" + filters.priority);
    if (filters.recipientType !== "")
      queryParams.push("recipientType=" + filters.recipientType);
    if (filters.isRead !== "") queryParams.push("isRead=" + filters.isRead);
    if (filters.fromDate !== "")
      queryParams.push("fromDate=" + filters.fromDate);
    if (filters.toDate !== "") queryParams.push("toDate=" + filters.toDate);
    if (filters.status !== "") queryParams.push("status=" + filters.status);
    var url =
      "http://localhost:5000/api/notifications?" + queryParams.join("&");

    fetch(url, {
      headers: { Authorization: "Bearer " + token },
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Fetch failed");
        return res.json();
      })
      .then(function (data) {
        if (data.success) {
          setNotifications(data.notifications);
          setStats({
            total: data.total,
            totalHighPriority: data.totalHighPriority,
            totalUnread: data.totalUnread,
            recentNotifications: data.recentNotifications || [],
          });
        } else {
          setErrorMsg("Could not load notifications.");
        }
      })
      .catch(function (err) {
        console.error(err);
        setErrorMsg("Error loading notifications. Is the backend running?");
      })
      .finally(function () {
        setIsLoading(false);
      });
  }

  useEffect(
    function () {
      fetchNotifications();
    },
    [page, filters],
  );

  return (
    <div className="admin-notif-page">
      <div className="admin-notif-header">
        <h1>Notifications Dashboard</h1>
        <div
          className="header-actions"
          style={{ display: "flex", gap: "15px" }}
        >
          <button
            onClick={fetchNotifications}
            className="view-btn"
            style={{
              padding: "8px 16px",
              fontSize: "1em",
              backgroundColor: "#5bc0de",
              color: "white",
            }}
          >
            ↻ Refresh
          </button>
          <button
            onClick={function () {
              setIsCreateModalOpen(true);
            }}
            className="view-btn"
            style={{ padding: "8px 16px", fontSize: "1em" }}
          >
            + Create Notification
          </button>
          <button
            onClick={function () {
              navigate("/dashboard");
            }}
            className="back-btn"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
      <div className="admin-notif-stats-grid">
        <div className="stat-card">
          <h4>Total Notifications</h4>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card">
          <h4>High Priority</h4>
          <span className="stat-value error-text">
            {stats.totalHighPriority}
          </span>
        </div>
        <div className="stat-card">
          <h4>Unread (Platform)</h4>
          <span className="stat-value blue-text">{stats.totalUnread}</span>
        </div>
        <div className="stat-card recent-stat-card">
          <h4>Recent Notifications</h4>
          <ul className="recent-list">
            {stats.recentNotifications.map(function (n) {
              return <li key={n._id}>{n.title}</li>;
            })}
            {stats.recentNotifications.length === 0 && <li>No recent items</li>}
          </ul>
        </div>
      </div>
      <NotificationFilters
        filters={filters}
        setFilters={setFilters}
        setPage={setPage}
      />
      {isLoading && <div className="loading-msg">Loading notifications...</div>}
      {!isLoading && errorMsg !== "" && (
        <div className="error-msg">{errorMsg}</div>
      )}
      {!isLoading && errorMsg === "" && notifications.length === 0 && (
        <div className="empty-msg">
          No notifications match your current filters.
        </div>
      )}
      {!isLoading && errorMsg === "" && notifications.length > 0 && (
        <NotificationList
          notifications={notifications}
          page={page}
          setPage={setPage}
          total={stats.total}
          limit={limit}
          currentUserRole={userData.role}
          onRefresh={fetchNotifications}
        />
      )}
      {isCreateModalOpen && (
        <CreateNotificationModal
          onClose={function () {
            setIsCreateModalOpen(false);
          }}
          onCreated={fetchNotifications}
        />
      )}
      <NotificationToast />
    </div>
  );
}

export default NotificationDashboard;

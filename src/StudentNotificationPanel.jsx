import { useState, useEffect } from "react";
import { toastManager } from "./live-classroom/NotificationToast";

function StudentNotificationPanel(props) {
  var userData = props.userData;
  var [notifications, setNotifications] = useState([]);
  var [isLoading, setIsLoading] = useState(true);
  var [errorMsg, setErrorMsg] = useState("");
  var [filter, setFilter] = useState("All");
  var [selectedNotification, setSelectedNotification] = useState(null);

  function fetchNotifications() {
    setIsLoading(true);
    setErrorMsg("");
    var token = localStorage.getItem("token");

    fetch("http://localhost:5000/api/notifications/my", {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Failed to fetch notifications");
        }
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          setNotifications(data.notifications);
        } else {
          setErrorMsg("Could not load notifications.");
        }
      })
      .catch(function (error) {
        console.error(error);
        setErrorMsg("Error loading notifications. Is the server running?");
      })
      .finally(function () {
        setIsLoading(false);
      });
  }
  useEffect(function () {
    fetchNotifications();
  }, []);

  function handleMarkAsRead(notif, e) {
    if (e) e.stopPropagation();

    var token = localStorage.getItem("token");
    fetch("http://localhost:5000/api/notifications/" + notif._id + "/read", {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then(function (response) {
        if (response.ok) {
          var updatedList = [];
          for (var i = 0; i < notifications.length; i++) {
            var current = notifications[i];
            if (current._id === notif._id) {
              var newReadBy = [].concat(current.readBy);
              newReadBy.push(userData.email);
              var updatedNotif = Object.assign({}, current, {
                readBy: newReadBy,
              });
              updatedList.push(updatedNotif);
            } else {
              updatedList.push(current);
            }
          }
          setNotifications(updatedList);
          toastManager.addToast("Marked as read", "success");
          if (
            selectedNotification !== null &&
            selectedNotification._id === notif._id
          ) {
            var newReadBySel = [].concat(selectedNotification.readBy);
            newReadBySel.push(userData.email);
            setSelectedNotification(
              Object.assign({}, selectedNotification, { readBy: newReadBySel }),
            );
          }
        }
      })
      .catch(function (err) {
        console.error("Mark as read failed:", err);
      });
  }

  function handleFilterChange(e) {
    setFilter(e.target.value);
  }

  function openDetails(notif) {
    setSelectedNotification(notif);
  }

  function closeDetails() {
    setSelectedNotification(null);
  }
  var displayedNotifications = [];
  for (var i = 0; i < notifications.length; i++) {
    var notif = notifications[i];
    var isRead = false;
    for (var j = 0; j < notif.readBy.length; j++) {
      if (notif.readBy[j] === userData.email) {
        isRead = true;
      }
    }

    if (filter === "All") {
      displayedNotifications.push(notif);
    } else if (filter === "Unread" && isRead === false) {
      displayedNotifications.push(notif);
    } else if (filter === "Read" && isRead === true) {
      displayedNotifications.push(notif);
    }
  }

  return (
    <div className="dashboard-card notification-panel">
      <div className="notification-panel-header">
        <h3>Your Notifications</h3>
        <div className="notification-controls">
          <select
            value={filter}
            onChange={handleFilterChange}
            className="notification-filter"
          >
            <option value="All">All</option>
            <option value="Unread">Unread</option>
            <option value="Read">Read</option>
          </select>
          <button onClick={fetchNotifications} className="refresh-btn">
            Refresh
          </button>
        </div>
      </div>

      {isLoading && <div className="loading-msg">Loading notifications...</div>}

      {!isLoading && errorMsg !== "" && (
        <div className="error-msg">{errorMsg}</div>
      )}

      {!isLoading && errorMsg === "" && displayedNotifications.length === 0 && (
        <div className="empty-msg">No notifications yet.</div>
      )}

      {!isLoading && errorMsg === "" && displayedNotifications.length > 0 && (
        <div className="notification-list">
          {displayedNotifications.map(function (notif) {
            var isRead = false;
            for (var j = 0; j < notif.readBy.length; j++) {
              if (notif.readBy[j] === userData.email) {
                isRead = true;
              }
            }

            var rowClass = "notification-row";
            if (isRead === false) {
              rowClass = rowClass + " unread-row";
            }

            return (
              <div
                key={notif._id}
                className={rowClass}
                onClick={function () {
                  openDetails(notif);
                }}
              >
                <div className="notif-main-info">
                  <span className="notif-priority">[{notif.priority}]</span>
                  <span className="notif-title">{notif.title}</span>
                </div>
                <div className="notif-meta">
                  <span>From: {notif.senderRole}</span>
                  <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="notif-actions">
                  {isRead === false && (
                    <button
                      className="mark-read-btn"
                      onClick={function (e) {
                        handleMarkAsRead(notif, e);
                      }}
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selectedNotification !== null && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div
            className="modal-box"
            onClick={function (e) {
              e.stopPropagation();
            }}
          >
            <button className="modal-close-btn" onClick={closeDetails}>
              ✕
            </button>
            <h2 className="modal-heading">{selectedNotification.title}</h2>

            <div className="modal-body-content">
              <p>
                <strong>From:</strong> {selectedNotification.senderId} (
                {selectedNotification.senderRole})
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(selectedNotification.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Priority:</strong> {selectedNotification.priority}
              </p>
              <hr />
              <p className="notif-full-message">
                {selectedNotification.message}
              </p>
            </div>
            <div
              className="modal-actions"
              style={{ marginTop: "20px", textAlign: "right" }}
            >
              {(function () {
                var isSelectedRead = false;
                for (var j = 0; j < selectedNotification.readBy.length; j++) {
                  if (selectedNotification.readBy[j] === userData.email) {
                    isSelectedRead = true;
                  }
                }

                if (isSelectedRead === false) {
                  return (
                    <button
                      className="mark-read-btn"
                      onClick={function (e) {
                        handleMarkAsRead(selectedNotification, e);
                      }}
                    >
                      Mark as Read
                    </button>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentNotificationPanel;

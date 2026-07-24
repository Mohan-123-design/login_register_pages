import { useState } from "react";
import EditNotificationModal from "./EditNotificationModal";
import { toastManager } from "./live-classroom/NotificationToast";

function NotificationList(props) {
  var notifications = props.notifications;
  var page = props.page;
  var setPage = props.setPage;
  var total = props.total;
  var limit = props.limit;
  var currentUserRole = props.currentUserRole;
  var onRefresh = props.onRefresh;
  var [selectedNotification, setSelectedNotification] = useState(null);
  var [notificationToEdit, setNotificationToEdit] = useState(null);
  var [notificationToDelete, setNotificationToDelete] = useState(null);
  var [isDeleting, setIsDeleting] = useState(false);
  var [deleteError, setDeleteError] = useState("");
  var totalPages = Math.ceil(total / limit);

  function openDetails(notif) {
    setSelectedNotification(notif);
  }

  function closeDetails() {
    setSelectedNotification(null);
  }

  function handleDeleteConfirm() {
    setIsDeleting(true);
    setDeleteError("");
    var token = localStorage.getItem("token");
    fetch(
      "http://localhost:5000/api/notifications/" + notificationToDelete._id,
      {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      },
    )
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.message || "Failed to delete");
          return data;
        });
      })
      .then(function (data) {
        if (data.success) {
          toastManager.addToast("Notification deleted successfully", "success");
          setNotificationToDelete(null);
          onRefresh();
        } else {
          setDeleteError(data.message || "Could not delete notification.");
        }
      })
      .catch(function (err) {
        setDeleteError(err.message || "Error connecting to server.");
      })
      .finally(function () {
        setIsDeleting(false);
      });
  }

  return (
    <div className="admin-notif-list-container">
      <table className="admin-notif-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Message</th>
            <th>Sender</th>
            <th>Priority</th>
            <th>Recipient</th>
            <th>Date</th>
            <th>Reads</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {notifications.map(function (notif) {
            var msgTruncated =
              notif.message.length > 30
                ? notif.message.substring(0, 30) + "..."
                : notif.message;
            return (
              <tr key={notif._id}>
                <td>{notif.title}</td>
                <td>{msgTruncated}</td>
                <td>{notif.senderId}</td>
                <td>{notif.priority}</td>
                <td>
                  {notif.recipientType}{" "}
                  {notif.batchName ? "(" + notif.batchName + ")" : ""}
                </td>
                <td>{new Date(notif.createdAt).toLocaleDateString()}</td>
                <td>{notif.readBy.length}</td>
                <td style={{ display: "flex", gap: "5px" }}>
                  <button
                    className="view-btn"
                    onClick={function () {
                      openDetails(notif);
                    }}
                  >
                    View
                  </button>
                  <button
                    className="view-btn"
                    style={{ backgroundColor: "#ff9900" }}
                    onClick={function () {
                      setNotificationToEdit(notif);
                    }}
                  >
                    Edit
                  </button>
                  {currentUserRole === "Admin" && (
                    <button
                      className="view-btn"
                      style={{ backgroundColor: "#d9534f" }}
                      onClick={function () {
                        setNotificationToDelete(notif);
                        setDeleteError("");
                      }}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="pagination-controls">
        <button
          disabled={page === 1}
          onClick={function () {
            setPage(page - 1);
          }}
        >
          Previous
        </button>
        <span className="page-indicator">
          Page {page} of {totalPages === 0 ? 1 : totalPages}
        </span>
        <button
          disabled={page >= totalPages || totalPages === 0}
          onClick={function () {
            setPage(page + 1);
          }}
        >
          Next
        </button>
      </div>

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
                <strong>To:</strong> {selectedNotification.recipientType}{" "}
                {selectedNotification.batchName ||
                  selectedNotification.recipientId}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(selectedNotification.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Priority:</strong> {selectedNotification.priority}
              </p>
              <p>
                <strong>Total Reads:</strong>{" "}
                {selectedNotification.readBy.length}
              </p>
              <hr />
              <p className="notif-full-message">
                {selectedNotification.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {notificationToEdit !== null && (
        <EditNotificationModal
          notification={notificationToEdit}
          onClose={function () {
            setNotificationToEdit(null);
          }}
          onUpdated={onRefresh}
        />
      )}

      {notificationToDelete !== null && (
        <div
          className="modal-overlay"
          onClick={function () {
            if (!isDeleting) setNotificationToDelete(null);
          }}
        >
          <div
            className="modal-box"
            onClick={function (e) {
              e.stopPropagation();
            }}
            style={{ maxWidth: "400px" }}
          >
            <h3 style={{ marginTop: 0 }}>Confirm Deletion</h3>
            {deleteError !== "" && (
              <div
                className="error-msg"
                style={{
                  padding: "10px",
                  marginBottom: "15px",
                  border: "1px solid #d9534f",
                  borderRadius: "4px",
                }}
              >
                {deleteError}
              </div>
            )}
            <p>
              Are you sure you want to delete this notification? This cannot be
              undone.
            </p>
            <div
              className="modal-actions"
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={function () {
                  setNotificationToDelete(null);
                }}
                disabled={isDeleting}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f0f0f0",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: "pointer",
                  color: "#333",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#d9534f",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationList;

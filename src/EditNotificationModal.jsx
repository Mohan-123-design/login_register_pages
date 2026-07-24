import { useState } from "react";
import { toastManager } from "./live-classroom/NotificationToast";

function EditNotificationModal(props) {
  var notification = props.notification;
  var onClose = props.onClose;
  var onUpdated = props.onUpdated;
  var [title, setTitle] = useState(notification.title || "");
  var [message, setMessage] = useState(notification.message || "");
  var [priority, setPriority] = useState(notification.priority || "Medium");
  var [isLoading, setIsLoading] = useState(false);
  var [errors, setErrors] = useState({});
  var [apiError, setApiError] = useState("");

  function validate() {
    var newErrors = {};
    if (title.trim() === "") newErrors.title = "Title is required.";
    if (message.trim() === "") newErrors.message = "Message is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSave() {
    if (!validate()) return;

    setIsLoading(true);
    setApiError("");

    var token = localStorage.getItem("token");
    var payload = {
      title: title,
      message: message,
      priority: priority,
    };

    fetch("http://localhost:5000/api/notifications/" + notification._id, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok)
            throw new Error(data.message || "Failed to update notification");
          return data;
        });
      })
      .then(function (data) {
        if (data.success) {
          toastManager.addToast(
            "Notification updated successfully!",
            "success",
          );
          onUpdated();
          onClose();
        } else {
          setApiError(data.message || "Could not update notification.");
        }
      })
      .catch(function (err) {
        console.error(err);
        setApiError(err.message || "Error connecting to server.");
      })
      .finally(function () {
        setIsLoading(false);
      });
  }

  return (
    <div
      className="modal-overlay"
      onClick={function () {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="modal-box"
        onClick={function (e) {
          e.stopPropagation();
        }}
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          disabled={isLoading}
        >
          ✕
        </button>
        <h2 className="modal-heading">Edit Notification</h2>
        {apiError !== "" && (
          <div
            className="error-msg"
            style={{
              padding: "10px",
              marginBottom: "15px",
              border: "1px solid #d9534f",
              borderRadius: "4px",
            }}
          >
            {apiError}
          </div>
        )}
        <div className="modal-body-content">
          <div className="form-group" style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
                fontSize: "0.85em",
                color: "#555",
              }}
            >
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={function (e) {
                setTitle(e.target.value);
              }}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
              disabled={isLoading}
            />
            {errors.title && (
              <div
                className="error-text"
                style={{ fontSize: "0.85em", marginTop: "4px" }}
              >
                {errors.title}
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
                fontSize: "0.85em",
                color: "#555",
              }}
            >
              Message *
            </label>
            <textarea
              value={message}
              onChange={function (e) {
                setMessage(e.target.value);
              }}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                minHeight: "80px",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              disabled={isLoading}
            />
            {errors.message && (
              <div
                className="error-text"
                style={{ fontSize: "0.85em", marginTop: "4px" }}
              >
                {errors.message}
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
                fontSize: "0.85em",
                color: "#555",
              }}
            >
              Priority
            </label>
            <select
              value={priority}
              onChange={function (e) {
                setPriority(e.target.value);
              }}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
              disabled={isLoading}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

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
            onClick={onClose}
            disabled={isLoading}
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
            onClick={handleSave}
            disabled={isLoading}
            style={{
              padding: "8px 16px",
              backgroundColor: "#0066cc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditNotificationModal;

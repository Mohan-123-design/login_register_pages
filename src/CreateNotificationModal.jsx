import { useState } from "react";
import { toastManager } from "./live-classroom/NotificationToast";
function CreateNotificationModal(props) {
  var onClose = props.onClose;
  var onCreated = props.onCreated;
  var [title, setTitle] = useState("");
  var [message, setMessage] = useState("");
  var [recipientType, setRecipientType] = useState("All");
  var [conditionalValue, setConditionalValue] = useState("");
  var [priority, setPriority] = useState("Medium");
  var [isLoading, setIsLoading] = useState(false);
  var [errors, setErrors] = useState({});
  var [apiError, setApiError] = useState("");

  function validate() {
    var newErrors = {};
    if (title.trim() === "") newErrors.title = "Title is required.";
    if (message.trim() === "") newErrors.message = "Message is required.";
    if (recipientType === "Batch" && conditionalValue.trim() === "") {
      newErrors.conditional = "Batch name is required.";
    }
    if (recipientType === "User") {
      if (conditionalValue.trim() === "") {
        newErrors.conditional = "User email is required.";
      } else if (conditionalValue.indexOf("@") === -1) {
        newErrors.conditional = "Please enter a valid email address.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSend() {
    if (!validate()) return;
    setIsLoading(true);
    setApiError("");
    var token = localStorage.getItem("token");
    var userData = JSON.parse(localStorage.getItem("loggedInUser"));
    var payload = {
      title: title,
      message: message,
      recipientType: recipientType,
      priority: priority,
      senderId: userData.email,
      senderRole: userData.role,
    };

    if (recipientType === "Batch") {
      payload.batchName = conditionalValue;
    } else if (recipientType === "User") {
      payload.recipientId = conditionalValue;
    }

    fetch("http://localhost:5000/api/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) {
            throw new Error(data.message || "Failed to create notification");
          }
          return data;
        });
      })
      .then(function (data) {
        if (data.success) {
          toastManager.addToast(
            "Notification created successfully!",
            "success",
          );
          onCreated();
          onClose();
        } else {
          setApiError(data.message || "Could not create notification.");
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
        <h2 className="modal-heading">Create Notification</h2>

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
              Recipient Type
            </label>
            <select
              value={recipientType}
              onChange={function (e) {
                setRecipientType(e.target.value);
                setConditionalValue("");
                setErrors({});
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
              <option value="All">All Platform Users</option>
              <option value="Batch">Specific Batch</option>
              <option value="User">Specific User</option>
            </select>
          </div>

          {recipientType === "Batch" && (
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
                Batch Name *
              </label>
              <input
                type="text"
                placeholder="e.g. AI Education Batch 1"
                value={conditionalValue}
                onChange={function (e) {
                  setConditionalValue(e.target.value);
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
              {errors.conditional && (
                <div
                  className="error-text"
                  style={{ fontSize: "0.85em", marginTop: "4px" }}
                >
                  {errors.conditional}
                </div>
              )}
            </div>
          )}

          {recipientType === "User" && (
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
                User Email *
              </label>
              <input
                type="email"
                placeholder="student@example.com"
                value={conditionalValue}
                onChange={function (e) {
                  setConditionalValue(e.target.value);
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
              {errors.conditional && (
                <div
                  className="error-text"
                  style={{ fontSize: "0.85em", marginTop: "4px" }}
                >
                  {errors.conditional}
                </div>
              )}
            </div>
          )}

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
            onClick={handleSend}
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
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateNotificationModal;

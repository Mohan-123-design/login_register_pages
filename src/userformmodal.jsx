import { useState } from "react";
import "./userformmodal.css";

function UserFormModal({ mode, user, onClose, onSaved }) {
  var isEdit = mode === "edit";
  var [firstName, setFirstName] = useState(isEdit ? user.firstName : "");
  var [lastName, setLastName] = useState(isEdit ? user.lastName : "");
  var [email, setEmail] = useState(isEdit ? user.email : "");
  var [password, setPassword] = useState("");
  var [role, setRole] = useState(isEdit ? user.role : "Student");
  var [batch, setBatch] = useState(isEdit ? user.batch || "" : "");
  var [errorMessage, setErrorMessage] = useState("");
  var [isSubmitting, setIsSubmitting] = useState(false);

  function getToken() {
    return localStorage.getItem("token");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");

    if (firstName.trim() === "" || lastName.trim() === "" || email.trim() === "") {
      setErrorMessage("First name, last name and email are required.");
      return;
    }
    if (!isEdit && password.trim() === "") {
      setErrorMessage("Password is required for a new user.");
      return;
    }

    setIsSubmitting(true);
    try {
      var url = isEdit ? "/api/admin/users/" + user._id : "/api/admin/users";
      var method = isEdit ? "PUT" : "POST";
      var payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role: role,
        batch: batch.trim(),
      };
      if (!isEdit) {
        payload.password = password;
      }

      var response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getToken(),
        },
        body: JSON.stringify(payload),
      });
      var data = await response.json();

      if (data.success) {
        onSaved(isEdit ? "User updated successfully." : "User created successfully.");
      } else {
        setErrorMessage(data.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      setErrorMessage("Server or network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="user-modal-overlay" onClick={onClose}>
      <div className="user-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="user-modal-header">
          <h2>{isEdit ? "Edit User" : "Add New User"}</h2>
          <button className="user-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-modal-form">
          {errorMessage !== "" && (
            <div className="user-modal-error">{errorMessage}</div>
          )}

          <div className="user-modal-row">
            <div className="user-modal-field">
              <label>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="user-modal-field">
              <label>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="user-modal-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {!isEdit && (
            <div className="user-modal-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Temporary password for the new user"
              />
            </div>
          )}

          <div className="user-modal-row">
            <div className="user-modal-field">
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Student">Student</option>
                <option value="Trainer">Trainer</option>
                <option value="Employer">Employer</option>
                <option value="Employee">Employee</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="user-modal-field">
              <label>Batch</label>
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="e.g. B1"
              />
            </div>
          </div>

          <div className="user-modal-actions">
            <button type="button" className="user-modal-btn user-modal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="user-modal-btn user-modal-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserFormModal;
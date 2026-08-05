import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./usermanagement.css";
import UserFormModal from "./userformmodal";

function UserManagement() {
  var loggedInUser = localStorage.getItem("loggedInUser");
  if (loggedInUser === null) {
    window.location.href = "/access-denied";
    return null;
  }
  var currentUser = JSON.parse(loggedInUser);
  if (currentUser.role !== "Admin") {
    window.location.href = "/access-denied";
    return null;
  }

  var navigate = useNavigate();
  var [users, setUsers] = useState([]);
  var [total, setTotal] = useState(0);
  var [totalPages, setTotalPages] = useState(1);
  var [page, setPage] = useState(1);
  var limit = 8;
  var [searchInput, setSearchInput] = useState("");
  var [search, setSearch] = useState("");
  var [roleFilter, setRoleFilter] = useState("");
  var [statusFilter, setStatusFilter] = useState("");
  var [isLoading, setIsLoading] = useState(true);
  var [errorMessage, setErrorMessage] = useState("");
  var [actionMessage, setActionMessage] = useState("");
  var [isModalOpen, setIsModalOpen] = useState(false);
  var [modalMode, setModalMode] = useState("add");
  var [selectedUser, setSelectedUser] = useState(null);

  function getToken() {
    return localStorage.getItem("token");
  }

  function fetchUsers() {
    setIsLoading(true);
    setErrorMessage("");
    var queryParams = [];
    queryParams.push("page=" + page);
    queryParams.push("limit=" + limit);
    if (search !== "") queryParams.push("search=" + encodeURIComponent(search));
    if (roleFilter !== "") queryParams.push("role=" + roleFilter);
    if (statusFilter !== "") queryParams.push("status=" + statusFilter);

    var url = "/api/admin/users?" + queryParams.join("&");

    fetch(url, {
      headers: { Authorization: "Bearer " + getToken() },
    })
      .then(function (response) {
        if (response.status === 401 || response.status === 403) {
          navigate("/access-denied");
          return null;
        }
        return response.json();
      })
      .then(function (data) {
        if (data === null) return;
        if (data.success) {
          setUsers(data.users);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        } else {
          setErrorMessage(data.message || "Failed to load users.");
        }
      })
      .catch(function (error) {
        console.error("Error fetching users:", error);
        setErrorMessage("Server or network error. Is the backend running?");
      })
      .finally(function () {
        setIsLoading(false);
      });
  }

  useEffect(
    function () {
      fetchUsers();
    },
    [page, search, roleFilter, statusFilter],
  );

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleRoleFilterChange(e) {
    setPage(1);
    setRoleFilter(e.target.value);
  }

  function handleStatusFilterChange(e) {
    setPage(1);
    setStatusFilter(e.target.value);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setPage(1);
  }

  function openAddModal() {
    setModalMode("add");
    setSelectedUser(null);
    setIsModalOpen(true);
  }

  function openEditModal(user) {
    setModalMode("edit");
    setSelectedUser(user);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSelectedUser(null);
  }

  function showActionMessage(message) {
    setActionMessage(message);
    setTimeout(function () {
      setActionMessage("");
    }, 3500);
  }

  function handleModalSaved(message) {
    closeModal();
    showActionMessage(message);
    fetchUsers();
  }

  async function toggleStatus(user) {
    var newStatus = user.status === "Active" ? "Inactive" : "Active";
    var confirmToggle = window.confirm(
      newStatus === "Inactive"
        ? "Deactivate " + user.firstName + " " + user.lastName + "? They will not be able to log in."
        : "Activate " + user.firstName + " " + user.lastName + "?",
    );
    if (confirmToggle !== true) return;

    try {
      var response = await fetch("/api/admin/users/" + user._id + "/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getToken(),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      var data = await response.json();
      if (data.success) {
        showActionMessage(data.message);
        fetchUsers();
      } else {
        alert(data.message || "Failed to update status.");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("Failed to update status. Please try again.");
    }
  }

  async function resetPassword(user) {
    var confirmReset = window.confirm(
      "Reset password for " + user.firstName + " " + user.lastName + "? A temporary password will be generated.",
    );
    if (confirmReset !== true) return;

    try {
      var response = await fetch("/api/admin/users/" + user._id + "/reset-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getToken(),
        },
        body: JSON.stringify({}),
      });
      var data = await response.json();
      if (data.success) {
        if (data.temporaryPassword) {
          window.prompt(
            "Password reset. Share this temporary password with " + user.firstName + ":",
            data.temporaryPassword,
          );
        } else {
          showActionMessage(data.message);
        }
      } else {
        alert(data.message || "Failed to reset password.");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("Failed to reset password. Please try again.");
    }
  }

  async function deleteUser(user) {
    var confirmDelete = window.confirm(
      "Are you sure you want to permanently delete " + user.firstName + " " + user.lastName + "?",
    );
    if (confirmDelete !== true) return;

    try {
      var response = await fetch("/api/admin/users/" + user._id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + getToken() },
      });
      var data = await response.json();
      if (data.success) {
        showActionMessage(data.message);
        if (users.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          fetchUsers();
        }
      } else {
        alert(data.message || "Failed to delete user.");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Please try again.");
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "-";
    var d = new Date(dateString);
    return d.toLocaleDateString();
  }

  return (
    <div className="user-mgmt-page">
      <div className="user-mgmt-header">
        <div>
          <h1>User Management</h1>
          <p className="user-mgmt-subtitle">
            {total} total user{total === 1 ? "" : "s"}
          </p>
        </div>
        <div className="user-mgmt-header-actions">
          <button className="user-mgmt-btn user-mgmt-btn-secondary" onClick={() => navigate("/admin-dashboard")}>
            Back to Dashboard
          </button>
          <button className="user-mgmt-btn user-mgmt-btn-primary" onClick={openAddModal}>
            + Add User
          </button>
        </div>
      </div>

      {actionMessage !== "" && (
        <div className="user-mgmt-toast">{actionMessage}</div>
      )}

      <div className="user-mgmt-filters">
        <form className="user-mgmt-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="user-mgmt-search-input"
          />
          <button type="submit" className="user-mgmt-btn user-mgmt-btn-secondary">
            Search
          </button>
        </form>

        <select value={roleFilter} onChange={handleRoleFilterChange} className="user-mgmt-select">
          <option value="">All Roles</option>
          <option value="Student">Student</option>
          <option value="Trainer">Trainer</option>
          <option value="Employer">Employer</option>
          <option value="Employee">Employee</option>
          <option value="Admin">Admin</option>
        </select>

        <select value={statusFilter} onChange={handleStatusFilterChange} className="user-mgmt-select">
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        {(search !== "" || roleFilter !== "" || statusFilter !== "") && (
          <button className="user-mgmt-btn user-mgmt-btn-text" onClick={clearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {isLoading && <div className="user-mgmt-status user-mgmt-loading">Loading users...</div>}
      {!isLoading && errorMessage !== "" && (
        <div className="user-mgmt-status user-mgmt-error">{errorMessage}</div>
      )}

      {!isLoading && errorMessage === "" && (
        <>
          <div className="user-mgmt-table-wrap">
            <table className="user-mgmt-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Batch</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan="7" className="user-mgmt-empty-row">
                      No users found.
                    </td>
                  </tr>
                )}
                {users.map(function (user) {
                  return (
                    <tr key={user._id}>
                      <td>{user.firstName + " " + user.lastName}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className="user-mgmt-role-badge">{user.role}</span>
                      </td>
                      <td>{user.batch || "-"}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <button
                          className={
                            "user-mgmt-status-toggle " +
                            (user.status === "Active"
                              ? "user-mgmt-status-active"
                              : "user-mgmt-status-inactive")
                          }
                          onClick={() => toggleStatus(user)}
                          title="Click to toggle status"
                        >
                          <span className="user-mgmt-toggle-dot"></span>
                          {user.status}
                        </button>
                      </td>
                      <td>
                        <div className="user-mgmt-row-actions">
                          <button className="user-mgmt-action-link" onClick={() => openEditModal(user)}>
                            Edit
                          </button>
                          <button className="user-mgmt-action-link" onClick={() => resetPassword(user)}>
                            Reset Password
                          </button>
                          <button
                            className="user-mgmt-action-link user-mgmt-action-danger"
                            onClick={() => deleteUser(user)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="user-mgmt-pagination">
            <button
              className="user-mgmt-btn user-mgmt-btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span className="user-mgmt-page-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="user-mgmt-btn user-mgmt-btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}

      {isModalOpen && (
        <UserFormModal
          mode={modalMode}
          user={selectedUser}
          onClose={closeModal}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  );
}

export default UserManagement;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./assignmentmanagement.css";
import AssignmentFormModal from "./assignmentformmodal";

function AssignmentManagement() {
  var loggedInUser = localStorage.getItem("loggedInUser");
  if (loggedInUser === null) {
    window.location.href = "/access-denied";
    return null;
  }
  var currentUser = JSON.parse(loggedInUser);
  if (currentUser.role !== "Admin" && currentUser.role !== "Trainer") {
    window.location.href = "/access-denied";
    return null;
  }

  var navigate = useNavigate();
  var [assignments, setAssignments] = useState([]);
  var [total, setTotal] = useState(0);
  var [totalPages, setTotalPages] = useState(1);
  var [page, setPage] = useState(1);
  var limit = 8;
  var [searchInput, setSearchInput] = useState("");
  var [search, setSearch] = useState("");
  var [statusFilter, setStatusFilter] = useState("");
  var [isLoading, setIsLoading] = useState(true);
  var [errorMessage, setErrorMessage] = useState("");
  var [actionMessage, setActionMessage] = useState("");
  var [isModalOpen, setIsModalOpen] = useState(false);
  var [modalMode, setModalMode] = useState("add");
  var [selectedAssignment, setSelectedAssignment] = useState(null);

  function getToken() {
    return localStorage.getItem("token");
  }

  function fetchAssignments() {
    setIsLoading(true);
    setErrorMessage("");
    var queryParams = [];
    queryParams.push("page=" + page);
    queryParams.push("limit=" + limit);
    if (search !== "") queryParams.push("search=" + encodeURIComponent(search));
    if (statusFilter !== "") queryParams.push("status=" + statusFilter);

    var url = "/api/assignments?" + queryParams.join("&");

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
          setAssignments(data.assignments);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        } else {
          setErrorMessage(data.message || "Failed to load assignments.");
        }
      })
      .catch(function (error) {
        console.error("Error fetching assignments:", error);
        setErrorMessage("Server or network error. Is the backend running?");
      })
      .finally(function () {
        setIsLoading(false);
      });
  }

  useEffect(
    function () {
      fetchAssignments();
    },
    [page, search, statusFilter],
  );

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleStatusFilterChange(e) {
    setPage(1);
    setStatusFilter(e.target.value);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setPage(1);
  }

  function openAddModal() {
    setModalMode("add");
    setSelectedAssignment(null);
    setIsModalOpen(true);
  }

  function openEditModal(assignment) {
    setModalMode("edit");
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSelectedAssignment(null);
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
    fetchAssignments();
  }

  async function changeStatus(assignment, action, confirmText) {
    if (confirmText) {
      var confirmed = window.confirm(confirmText);
      if (confirmed !== true) return;
    }
    try {
      var response = await fetch("/api/assignments/" + assignment._id + "/" + action, {
        method: "PATCH",
        headers: { Authorization: "Bearer " + getToken() },
      });
      var data = await response.json();
      if (data.success) {
        showActionMessage(data.message);
        fetchAssignments();
      } else {
        alert(data.message || "Failed to update assignment status.");
      }
    } catch (error) {
      console.error("Error updating assignment status:", error);
      alert("Failed to update assignment status. Please try again.");
    }
  }

  async function deleteAssignment(assignment) {
    var confirmDelete = window.confirm(
      'Are you sure you want to permanently delete "' + assignment.title + '"? This also removes all its submissions.',
    );
    if (confirmDelete !== true) return;

    try {
      var response = await fetch("/api/assignments/" + assignment._id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + getToken() },
      });
      var data = await response.json();
      if (data.success) {
        showActionMessage(data.message);
        if (assignments.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          fetchAssignments();
        }
      } else {
        alert(data.message || "Failed to delete assignment.");
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Failed to delete assignment. Please try again.");
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "-";
    var d = new Date(dateString);
    return d.toLocaleString();
  }

  function statusClass(status) {
    if (status === "Draft") return "assign-mgmt-status-draft";
    if (status === "Published") return "assign-mgmt-status-published";
    if (status === "Open") return "assign-mgmt-status-open";
    if (status === "Closed") return "assign-mgmt-status-closed";
    if (status === "Completed") return "assign-mgmt-status-completed";
    return "assign-mgmt-status-draft";
  }

  function renderStatusActions(assignment) {
    var buttons = [];
    if (assignment.status === "Draft") {
      buttons.push(
        <button
          key="publish"
          className="assign-mgmt-action-link"
          onClick={() =>
            changeStatus(
              assignment,
              "publish",
              'Publish "' + assignment.title + '"? It will become visible to students in its batch.',
            )
          }
        >
          Publish
        </button>,
      );
    }
    if (assignment.status === "Published") {
      buttons.push(
        <button
          key="unpublish"
          className="assign-mgmt-action-link"
          onClick={() => changeStatus(assignment, "unpublish", 'Move "' + assignment.title + '" back to Draft?')}
        >
          Unpublish
        </button>,
      );
      buttons.push(
        <button
          key="open"
          className="assign-mgmt-action-link"
          onClick={() => changeStatus(assignment, "open", 'Open "' + assignment.title + '" for student submissions?')}
        >
          Open
        </button>,
      );
    }
    if (assignment.status === "Open") {
      buttons.push(
        <button
          key="close"
          className="assign-mgmt-action-link"
          onClick={() =>
            changeStatus(assignment, "close", 'Close "' + assignment.title + '"? Students will no longer be able to submit.')
          }
        >
          Close
        </button>,
      );
    }
    if (assignment.status === "Closed") {
      buttons.push(
        <button
          key="reopen"
          className="assign-mgmt-action-link"
          onClick={() => changeStatus(assignment, "open", 'Re-open "' + assignment.title + '" for submissions?')}
        >
          Re-open
        </button>,
      );
      buttons.push(
        <button
          key="complete"
          className="assign-mgmt-action-link"
          onClick={() => changeStatus(assignment, "complete", 'Mark "' + assignment.title + '" as Completed?')}
        >
          Mark Completed
        </button>,
      );
    }
    return buttons;
  }

  return (
    <div className="assign-mgmt-page">
      <div className="assign-mgmt-header">
        <div>
          <h1>Assignment Management</h1>
          <p className="assign-mgmt-subtitle">
            {total} total assignment{total === 1 ? "" : "s"}
          </p>
        </div>
        <div className="assign-mgmt-header-actions">
          <button
            className="assign-mgmt-btn assign-mgmt-btn-secondary"
            onClick={() => navigate(currentUser.role === "Admin" ? "/admin-dashboard" : "/dashboard")}
          >
            Back to Dashboard
          </button>
          <button className="assign-mgmt-btn assign-mgmt-btn-primary" onClick={openAddModal}>
            + Create Assignment
          </button>
        </div>
      </div>

      {actionMessage !== "" && <div className="assign-mgmt-toast">{actionMessage}</div>}

      <div className="assign-mgmt-filters">
        <form className="assign-mgmt-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search by title, course or batch..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="assign-mgmt-search-input"
          />
          <button type="submit" className="assign-mgmt-btn assign-mgmt-btn-secondary">
            Search
          </button>
        </form>

        <select value={statusFilter} onChange={handleStatusFilterChange} className="assign-mgmt-select">
          <option value="">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
          <option value="Completed">Completed</option>
        </select>

        {(search !== "" || statusFilter !== "") && (
          <button className="assign-mgmt-btn assign-mgmt-btn-text" onClick={clearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {isLoading && <div className="assign-mgmt-status-msg assign-mgmt-loading">Loading assignments...</div>}
      {!isLoading && errorMessage !== "" && (
        <div className="assign-mgmt-status-msg assign-mgmt-error">{errorMessage}</div>
      )}

      {!isLoading && errorMessage === "" && (
        <>
          <div className="assign-mgmt-table-wrap">
            <table className="assign-mgmt-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Course</th>
                  <th>Batch</th>
                  <th>Due Date</th>
                  <th>Total Marks</th>
                  <th>Submissions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 && (
                  <tr>
                    <td colSpan="8" className="assign-mgmt-empty-row">
                      No assignments found.
                    </td>
                  </tr>
                )}
                {assignments.map(function (assignment) {
                  return (
                    <tr key={assignment._id}>
                      <td>{assignment.title}</td>
                      <td>{assignment.courseName || "-"}</td>
                      <td>{assignment.batchName || "-"}</td>
                      <td className={assignment.isOverdue ? "assign-mgmt-overdue-cell" : ""}>
                        {formatDate(assignment.dueDate)}
                      </td>
                      <td>{assignment.totalMarks}</td>
                      <td>
                        {assignment.submissionCount}/{assignment.totalStudents}
                      </td>
                      <td>
                        <span className={"assign-mgmt-status-badge " + statusClass(assignment.status)}>
                          {assignment.status}
                        </span>
                      </td>
                      <td>
                        <div className="assign-mgmt-row-actions">
                          <button className="assign-mgmt-action-link" onClick={() => openEditModal(assignment)}>
                            Edit
                          </button>
                          {renderStatusActions(assignment)}
                          <button
                            className="assign-mgmt-action-link"
                            onClick={() => navigate("/admin/assignments/" + assignment._id + "/submissions")}
                          >
                            Submissions
                          </button>
                          <button
                            className="assign-mgmt-action-link assign-mgmt-action-danger"
                            onClick={() => deleteAssignment(assignment)}
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

          <div className="assign-mgmt-pagination">
            <button
              className="assign-mgmt-btn assign-mgmt-btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span className="assign-mgmt-page-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="assign-mgmt-btn assign-mgmt-btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}

      {isModalOpen && (
        <AssignmentFormModal
          mode={modalMode}
          assignment={selectedAssignment}
          onClose={closeModal}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  );
}

export default AssignmentManagement;
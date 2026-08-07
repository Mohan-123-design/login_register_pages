import { useState, useEffect } from "react";
import "./batchdetails.css";
import BatchFormModal from "./batchformmodal";
import StudentAllocationModal from "./studentallocationmodal";
import TrainerAllocationModal from "./trainerallocationmodal";

function BatchDetails({ batchId, onBack, onChanged }) {
  var [batch, setBatch] = useState(null);
  var [enrolledStudents, setEnrolledStudents] = useState([]);
  var [seatsRemaining, setSeatsRemaining] = useState(null);
  var [isLoading, setIsLoading] = useState(true);
  var [errorMessage, setErrorMessage] = useState("");
  var [actionMessage, setActionMessage] = useState("");
  var [isEditModalOpen, setIsEditModalOpen] = useState(false);
  var [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  var [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);

  function getToken() {
    return localStorage.getItem("token");
  }

  function fetchBatch() {
    setIsLoading(true);
    setErrorMessage("");
    fetch("/api/admin/batches/" + batchId, {
      headers: { Authorization: "Bearer " + getToken() },
    })
      .then(function (response) {
        if (response.status === 404) {
          setErrorMessage("Batch not found.");
          return null;
        }
        return response.json();
      })
      .then(function (data) {
        if (data === null) return;
        if (data.success) {
          setBatch(data.batch);
          setEnrolledStudents(data.enrolledStudents);
          setSeatsRemaining(data.seatsRemaining);
        } else {
          setErrorMessage(data.message || "Failed to load batch.");
        }
      })
      .catch(function (error) {
        console.error("Error fetching batch:", error);
        setErrorMessage("Server or network error. Is the backend running?");
      })
      .finally(function () {
        setIsLoading(false);
      });
  }

  useEffect(
    function () {
      fetchBatch();
    },
    [batchId],
  );

  function showActionMessage(message) {
    setActionMessage(message);
    setTimeout(function () {
      setActionMessage("");
    }, 3500);
  }

  function handleEditSaved(message) {
    setIsEditModalOpen(false);
    showActionMessage(message);
    fetchBatch();
    onChanged && onChanged();
  }

  function handleStudentsAllocated(message) {
    setIsStudentModalOpen(false);
    showActionMessage(message);
    fetchBatch();
    onChanged && onChanged();
  }

  function handleTrainerAssigned(message) {
    setIsTrainerModalOpen(false);
    showActionMessage(message);
    fetchBatch();
    onChanged && onChanged();
  }

  async function removeStudent(student) {
    var confirmRemove = window.confirm(
      "Remove " + (student.firstName + " " + student.lastName).trim() + " from this batch?",
    );
    if (confirmRemove !== true) return;

    try {
      var response = await fetch(
        "/api/admin/batches/" + batchId + "/students/" + encodeURIComponent(student.email),
        {
          method: "DELETE",
          headers: { Authorization: "Bearer " + getToken() },
        },
      );
      var data = await response.json();
      if (data.success) {
        showActionMessage(data.message);
        fetchBatch();
        onChanged && onChanged();
      } else {
        alert(data.message || "Failed to remove student.");
      }
    } catch (error) {
      console.error("Error removing student:", error);
      alert("Failed to remove student. Please try again.");
    }
  }

  async function changeStatus(newStatus) {
    try {
      var response = await fetch("/api/admin/batches/" + batchId + "/status", {
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
        fetchBatch();
        onChanged && onChanged();
      } else {
        alert(data.message || "Failed to update batch status.");
      }
    } catch (error) {
      console.error("Error updating batch status:", error);
      alert("Failed to update batch status. Please try again.");
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "-";
    var d = new Date(dateString);
    return d.toLocaleDateString();
  }

  function statusBadgeClass(status) {
    if (status === "Active") return "batch-details-status-active";
    if (status === "Upcoming") return "batch-details-status-upcoming";
    if (status === "Completed") return "batch-details-status-completed";
    return "batch-details-status-archived";
  }

  return (
    <div className="batch-details-wrap">
      <div className="batch-details-header">
        <button className="batch-details-btn batch-details-btn-secondary" onClick={onBack}>
          Back to Batches
        </button>
      </div>

      {actionMessage !== "" && <div className="batch-details-toast">{actionMessage}</div>}

      {isLoading && <div className="batch-details-status batch-details-loading">Loading batch...</div>}
      {!isLoading && errorMessage !== "" && (
        <div className="batch-details-status batch-details-error">{errorMessage}</div>
      )}

      {!isLoading && errorMessage === "" && batch !== null && (
        <>
          <div className="batch-details-card">
            <div className="batch-details-title-row">
              <div>
                <h1>{batch.name}</h1>
                <p className="batch-details-subtitle">{batch.code || "No batch code"}</p>
              </div>
              <span className={"batch-details-status-badge " + statusBadgeClass(batch.status)}>{batch.status}</span>
            </div>

            <div className="batch-details-meta-grid">
              <div>
                <span className="batch-details-meta-label">Course</span>
                <span className="batch-details-meta-value">{batch.courseName || "-"}</span>
              </div>
              <div>
                <span className="batch-details-meta-label">Trainer</span>
                <span className="batch-details-meta-value">{batch.trainerName || "Unassigned"}</span>
              </div>
              <div>
                <span className="batch-details-meta-label">Schedule</span>
                <span className="batch-details-meta-value">{batch.schedule || "-"}</span>
              </div>
              <div>
                <span className="batch-details-meta-label">Start Date</span>
                <span className="batch-details-meta-value">{formatDate(batch.startDate)}</span>
              </div>
              <div>
                <span className="batch-details-meta-label">End Date</span>
                <span className="batch-details-meta-value">{formatDate(batch.endDate)}</span>
              </div>
              <div>
                <span className="batch-details-meta-label">Capacity</span>
                <span className="batch-details-meta-value">
                  {batch.studentCount}
                  {batch.capacity > 0 ? " / " + batch.capacity + " seats" : " (unlimited)"}
                </span>
              </div>
              <div>
                <span className="batch-details-meta-label">Seats Remaining</span>
                <span className="batch-details-meta-value">
                  {seatsRemaining === null ? "Unlimited" : seatsRemaining}
                </span>
              </div>
            </div>

            <div className="batch-details-actions">
              <button className="batch-details-btn batch-details-btn-primary" onClick={() => setIsEditModalOpen(true)}>
                Edit Batch
              </button>
              <button className="batch-details-btn batch-details-btn-secondary" onClick={() => setIsTrainerModalOpen(true)}>
                {batch.trainerName ? "Change Trainer" : "Assign Trainer"}
              </button>
              <button className="batch-details-btn batch-details-btn-secondary" onClick={() => setIsStudentModalOpen(true)}>
                Allocate Students
              </button>
              <select
                className="batch-details-status-select"
                value={batch.status}
                onChange={(e) => changeStatus(e.target.value)}
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="batch-details-card">
            <h2>Batch Analytics</h2>
            <div className="batch-details-analytics-grid">
              <div className="batch-details-analytics-card">
                <span className="batch-details-analytics-number">{enrolledStudents.length}</span>
                <span className="batch-details-analytics-label">Allocated Students</span>
              </div>
              <div className="batch-details-analytics-card">
                <span className="batch-details-analytics-number">
                  {batch.capacity > 0 ? Math.round((enrolledStudents.length / batch.capacity) * 100) + "%" : "-"}
                </span>
                <span className="batch-details-analytics-label">Capacity Filled</span>
              </div>
              <div className="batch-details-analytics-card">
                <span className="batch-details-analytics-number">
                  {enrolledStudents.filter((s) => s.status === "Active").length}
                </span>
                <span className="batch-details-analytics-label">Active Students</span>
              </div>
              <div className="batch-details-analytics-card">
                <span className="batch-details-analytics-number">
                  {enrolledStudents.filter((s) => s.status === "Inactive").length}
                </span>
                <span className="batch-details-analytics-label">Inactive Students</span>
              </div>
            </div>
          </div>

          <div className="batch-details-card">
            <h2>Allocated Students ({enrolledStudents.length})</h2>
            {enrolledStudents.length === 0 && (
              <p className="batch-details-empty">No students have been allocated to this batch yet.</p>
            )}
            {enrolledStudents.length > 0 && (
              <div className="batch-details-table-wrap">
                <table className="batch-details-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Allocated On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledStudents.map(function (student) {
                      return (
                        <tr key={student.email}>
                          <td>{(student.firstName + " " + student.lastName).trim() || student.name}</td>
                          <td>{student.email}</td>
                          <td>{student.status}</td>
                          <td>{formatDate(student.allocatedAt)}</td>
                          <td>
                            <button
                              className="batch-details-action-link batch-details-action-danger"
                              onClick={() => removeStudent(student)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {isEditModalOpen && (
        <BatchFormModal mode="edit" batch={batch} onClose={() => setIsEditModalOpen(false)} onSaved={handleEditSaved} />
      )}

      {isStudentModalOpen && (
        <StudentAllocationModal
          batchId={batchId}
          onClose={() => setIsStudentModalOpen(false)}
          onSaved={handleStudentsAllocated}
        />
      )}

      {isTrainerModalOpen && (
        <TrainerAllocationModal
          batchId={batchId}
          currentTrainerEmail={batch ? batch.trainerEmail : ""}
          onClose={() => setIsTrainerModalOpen(false)}
          onSaved={handleTrainerAssigned}
        />
      )}
    </div>
  );
}

export default BatchDetails;
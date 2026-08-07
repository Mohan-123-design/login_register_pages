import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./batchmanagement.css";
import BatchFormModal from "./batchformmodal";
import BatchDetails from "./batchdetails";

function BatchManagement() {
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
  var [batches, setBatches] = useState([]);
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
  var [selectedBatch, setSelectedBatch] = useState(null);
  var [stats, setStats] = useState(null);
  var [activeBatchId, setActiveBatchId] = useState(null);

  function getToken() {
    return localStorage.getItem("token");
  }

  function fetchStats() {
    fetch("/api/admin/batches/stats", {
      headers: { Authorization: "Bearer " + getToken() },
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          setStats(data.stats);
        }
      })
      .catch(function (error) {
        console.error("Error fetching batch stats:", error);
      });
  }

  function fetchBatches() {
    setIsLoading(true);
    setErrorMessage("");
    var queryParams = [];
    queryParams.push("page=" + page);
    queryParams.push("limit=" + limit);
    if (search !== "") queryParams.push("search=" + encodeURIComponent(search));
    if (statusFilter !== "") queryParams.push("status=" + statusFilter);

    var url = "/api/admin/batches?" + queryParams.join("&");

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
          setBatches(data.batches);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        } else {
          setErrorMessage(data.message || "Failed to load batches.");
        }
      })
      .catch(function (error) {
        console.error("Error fetching batches:", error);
        setErrorMessage("Server or network error. Is the backend running?");
      })
      .finally(function () {
        setIsLoading(false);
      });
  }

  useEffect(
    function () {
      if (activeBatchId === null) {
        fetchBatches();
      }
    },
    [page, search, statusFilter, activeBatchId],
  );

  useEffect(function () {
    fetchStats();
  }, []);

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
    setSelectedBatch(null);
    setIsModalOpen(true);
  }

  function openEditModal(batch) {
    setModalMode("edit");
    setSelectedBatch(batch);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSelectedBatch(null);
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
    fetchBatches();
    fetchStats();
  }

  async function deleteBatch(batch) {
    var confirmDelete = window.confirm(
      'Are you sure you want to permanently delete "' + batch.name + '"? Allocated students will be unassigned from it.',
    );
    if (confirmDelete !== true) return;

    try {
      var response = await fetch("/api/admin/batches/" + batch._id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + getToken() },
      });
      var data = await response.json();
      if (data.success) {
        showActionMessage(data.message);
        if (batches.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          fetchBatches();
        }
        fetchStats();
      } else {
        alert(data.message || "Failed to delete batch.");
      }
    } catch (error) {
      console.error("Error deleting batch:", error);
      alert("Failed to delete batch. Please try again.");
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "-";
    var d = new Date(dateString);
    return d.toLocaleDateString();
  }

  function statusBadgeClass(status) {
    if (status === "Active") return "batch-mgmt-status-active";
    if (status === "Upcoming") return "batch-mgmt-status-upcoming";
    if (status === "Completed") return "batch-mgmt-status-completed";
    return "batch-mgmt-status-archived";
  }

  function openBatchDetails(batch) {
    setActiveBatchId(batch._id);
  }

  function closeBatchDetails() {
    setActiveBatchId(null);
    fetchBatches();
    fetchStats();
  }

  if (activeBatchId !== null) {
    return (
      <div className="batch-mgmt-page">
        <BatchDetails
          batchId={activeBatchId}
          onBack={closeBatchDetails}
          onChanged={function () {
            fetchStats();
          }}
        />
      </div>
    );
  }

  return (
    <div className="batch-mgmt-page">
      <div className="batch-mgmt-header">
        <div>
          <h1>Batch Management</h1>
          <p className="batch-mgmt-subtitle">
            {total} total batch{total === 1 ? "" : "es"}
          </p>
        </div>
        <div className="batch-mgmt-header-actions">
          <button className="batch-mgmt-btn batch-mgmt-btn-secondary" onClick={() => navigate("/admin-dashboard")}>
            Back to Dashboard
          </button>
          <button className="batch-mgmt-btn batch-mgmt-btn-primary" onClick={openAddModal}>
            + Add Batch
          </button>
        </div>
      </div>

      {actionMessage !== "" && <div className="batch-mgmt-toast">{actionMessage}</div>}

      {stats !== null && (
        <div className="batch-mgmt-stats-row">
          <div className="batch-mgmt-stat-card">
            <span className="batch-mgmt-stat-number">{stats.totalBatches}</span>
            <span className="batch-mgmt-stat-label">Total Batches</span>
          </div>
          <div className="batch-mgmt-stat-card">
            <span className="batch-mgmt-stat-number">{stats.activeBatches}</span>
            <span className="batch-mgmt-stat-label">Active</span>
          </div>
          <div className="batch-mgmt-stat-card">
            <span className="batch-mgmt-stat-number">{stats.upcomingBatches}</span>
            <span className="batch-mgmt-stat-label">Upcoming</span>
          </div>
          <div className="batch-mgmt-stat-card">
            <span className="batch-mgmt-stat-number">{stats.totalAllocatedStudents}</span>
            <span className="batch-mgmt-stat-label">Allocated Students</span>
          </div>
          <div className="batch-mgmt-stat-card">
            <span className="batch-mgmt-stat-number">{stats.capacityUtilization}%</span>
            <span className="batch-mgmt-stat-label">Capacity Utilization</span>
          </div>
          <div className="batch-mgmt-stat-card">
            <span className="batch-mgmt-stat-number">{stats.unassignedTrainerBatches}</span>
            <span className="batch-mgmt-stat-label">No Trainer</span>
          </div>
        </div>
      )}

      <div className="batch-mgmt-filters">
        <form className="batch-mgmt-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search by name, code, trainer or course..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="batch-mgmt-search-input"
          />
          <button type="submit" className="batch-mgmt-btn batch-mgmt-btn-secondary">
            Search
          </button>
        </form>

        <select value={statusFilter} onChange={handleStatusFilterChange} className="batch-mgmt-select">
          <option value="">All Status</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Archived">Archived</option>
        </select>

        {(search !== "" || statusFilter !== "") && (
          <button className="batch-mgmt-btn batch-mgmt-btn-text" onClick={clearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {isLoading && <div className="batch-mgmt-status batch-mgmt-loading">Loading batches...</div>}
      {!isLoading && errorMessage !== "" && (
        <div className="batch-mgmt-status batch-mgmt-error">{errorMessage}</div>
      )}

      {!isLoading && errorMessage === "" && (
        <>
          <div className="batch-mgmt-table-wrap">
            <table className="batch-mgmt-table">
              <thead>
                <tr>
                  <th>Batch Name</th>
                  <th>Course</th>
                  <th>Trainer</th>
                  <th>Students</th>
                  <th>Schedule</th>
                  <th>Start Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 && (
                  <tr>
                    <td colSpan="8" className="batch-mgmt-empty-row">
                      No batches found.
                    </td>
                  </tr>
                )}
                {batches.map(function (batch) {
                  return (
                    <tr key={batch._id}>
                      <td>
                        <button className="batch-mgmt-title-link" onClick={() => openBatchDetails(batch)}>
                          {batch.name}
                        </button>
                        {batch.code ? <div className="batch-mgmt-code">{batch.code}</div> : null}
                      </td>
                      <td>{batch.courseName || "-"}</td>
                      <td>{batch.trainerName || "Unassigned"}</td>
                      <td>
                        {batch.studentCount}
                        {batch.capacity > 0 ? " / " + batch.capacity : ""}
                      </td>
                      <td>{batch.schedule || "-"}</td>
                      <td>{formatDate(batch.startDate)}</td>
                      <td>
                        <span className={"batch-mgmt-status-badge " + statusBadgeClass(batch.status)}>
                          {batch.status}
                        </span>
                      </td>
                      <td>
                        <div className="batch-mgmt-row-actions">
                          <button className="batch-mgmt-action-link" onClick={() => openEditModal(batch)}>
                            Edit
                          </button>
                          <button
                            className="batch-mgmt-action-link batch-mgmt-action-danger"
                            onClick={() => deleteBatch(batch)}
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

          <div className="batch-mgmt-pagination">
            <button
              className="batch-mgmt-btn batch-mgmt-btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span className="batch-mgmt-page-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="batch-mgmt-btn batch-mgmt-btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}

      {isModalOpen && (
        <BatchFormModal mode={modalMode} batch={selectedBatch} onClose={closeModal} onSaved={handleModalSaved} />
      )}
    </div>
  );
}

export default BatchManagement;
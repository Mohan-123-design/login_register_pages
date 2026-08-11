import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./exammanagement.css";
import ExamFormModal from "./examformmodal";

function ExamManagement() {
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
  var [exams, setExams] = useState([]);
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
  var [selectedExam, setSelectedExam] = useState(null);

  function getToken() {
    return localStorage.getItem("token");
  }

  function fetchExams() {
    setIsLoading(true);
    setErrorMessage("");
    var queryParams = [];
    queryParams.push("page=" + page);
    queryParams.push("limit=" + limit);
    if (search !== "") queryParams.push("search=" + encodeURIComponent(search));
    if (statusFilter !== "") queryParams.push("status=" + statusFilter);

    var url = "/api/exams?" + queryParams.join("&");

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
          setExams(data.exams);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        } else {
          setErrorMessage(data.message || "Failed to load exams.");
        }
      })
      .catch(function (error) {
        console.error("Error fetching exams:", error);
        setErrorMessage("Server or network error. Is the backend running?");
      })
      .finally(function () {
        setIsLoading(false);
      });
  }

  useEffect(
    function () {
      fetchExams();
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
    setSelectedExam(null);
    setIsModalOpen(true);
  }

  function openEditModal(exam) {
    setModalMode("edit");
    setSelectedExam(exam);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSelectedExam(null);
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
    fetchExams();
  }

  async function togglePublish(exam) {
    var isPublishing = exam.effectiveStatus === "Draft" || exam.effectiveStatus === "Unpublished";
    var action = isPublishing ? "publish" : "unpublish";
    var confirmToggle = window.confirm(
      isPublishing
        ? 'Publish "' + exam.title + '"? It will become visible to students.'
        : 'Unpublish "' + exam.title + '"? Students will no longer be able to access it.',
    );
    if (confirmToggle !== true) return;

    try {
      var response = await fetch("/api/exams/" + exam._id + "/" + action, {
        method: "PATCH",
        headers: { Authorization: "Bearer " + getToken() },
      });
      var data = await response.json();
      if (data.success) {
        showActionMessage(data.message);
        fetchExams();
      } else {
        alert(data.message || "Failed to update exam status.");
      }
    } catch (error) {
      console.error("Error toggling publish state:", error);
      alert("Failed to update exam status. Please try again.");
    }
  }

  async function deleteExam(exam) {
    var confirmDelete = window.confirm('Are you sure you want to permanently delete "' + exam.title + '"?');
    if (confirmDelete !== true) return;

    try {
      var response = await fetch("/api/exams/" + exam._id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + getToken() },
      });
      var data = await response.json();
      if (data.success) {
        showActionMessage(data.message);
        if (exams.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          fetchExams();
        }
      } else {
        alert(data.message || "Failed to delete exam.");
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      alert("Failed to delete exam. Please try again.");
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "-";
    var d = new Date(dateString);
    return d.toLocaleString();
  }

  function statusClass(status) {
    if (status === "Draft") return "exam-mgmt-status-draft";
    if (status === "Published") return "exam-mgmt-status-published";
    if (status === "Ongoing") return "exam-mgmt-status-ongoing";
    if (status === "Completed") return "exam-mgmt-status-completed";
    return "exam-mgmt-status-unpublished";
  }

  return (
    <div className="exam-mgmt-page">
      <div className="exam-mgmt-header">
        <div>
          <h1>Exam Management</h1>
          <p className="exam-mgmt-subtitle">
            {total} total exam{total === 1 ? "" : "s"}
          </p>
        </div>
        <div className="exam-mgmt-header-actions">
          <button
            className="exam-mgmt-btn exam-mgmt-btn-secondary"
            onClick={() => navigate(currentUser.role === "Admin" ? "/admin-dashboard" : "/dashboard")}
          >
            Back to Dashboard
          </button>
          <button className="exam-mgmt-btn exam-mgmt-btn-primary" onClick={openAddModal}>
            + Create Exam
          </button>
        </div>
      </div>

      {actionMessage !== "" && <div className="exam-mgmt-toast">{actionMessage}</div>}

      <div className="exam-mgmt-filters">
        <form className="exam-mgmt-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search by exam name, course or batch..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="exam-mgmt-search-input"
          />
          <button type="submit" className="exam-mgmt-btn exam-mgmt-btn-secondary">
            Search
          </button>
        </form>

        <select value={statusFilter} onChange={handleStatusFilterChange} className="exam-mgmt-select">
          <option value="">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
          <option value="Unpublished">Unpublished</option>
        </select>

        {(search !== "" || statusFilter !== "") && (
          <button className="exam-mgmt-btn exam-mgmt-btn-text" onClick={clearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {isLoading && <div className="exam-mgmt-status-msg exam-mgmt-loading">Loading exams...</div>}
      {!isLoading && errorMessage !== "" && (
        <div className="exam-mgmt-status-msg exam-mgmt-error">{errorMessage}</div>
      )}

      {!isLoading && errorMessage === "" && (
        <>
          <div className="exam-mgmt-table-wrap">
            <table className="exam-mgmt-table">
              <thead>
                <tr>
                  <th>Exam Name</th>
                  <th>Course</th>
                  <th>Batch</th>
                  <th>Exam Date</th>
                  <th>Duration</th>
                  <th>Total Marks</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.length === 0 && (
                  <tr>
                    <td colSpan="9" className="exam-mgmt-empty-row">
                      No exams found.
                    </td>
                  </tr>
                )}
                {exams.map(function (exam) {
                  return (
                    <tr key={exam._id}>
                      <td>{exam.title}</td>
                      <td>{exam.courseName || "-"}</td>
                      <td>{exam.batchName || "-"}</td>
                      <td>{formatDate(exam.examDate)}</td>
                      <td>{exam.duration} min</td>
                      <td>{exam.totalMarks}</td>
                      <td>
                        {exam.attemptedCount}/{exam.totalStudents}
                      </td>
                      <td>
                        <span className={"exam-mgmt-status-badge " + statusClass(exam.effectiveStatus)}>
                          {exam.effectiveStatus}
                        </span>
                      </td>
                      <td>
                        <div className="exam-mgmt-row-actions">
                          <button className="exam-mgmt-action-link" onClick={() => openEditModal(exam)}>
                            Edit
                          </button>
                          <button className="exam-mgmt-action-link" onClick={() => togglePublish(exam)}>
                            {exam.effectiveStatus === "Draft" || exam.effectiveStatus === "Unpublished"
                              ? "Publish"
                              : "Unpublish"}
                          </button>
                          <button
                            className="exam-mgmt-action-link"
                            onClick={() => navigate("/exams/" + exam._id + "/results")}
                          >
                            Results
                          </button>
                          <button
                            className="exam-mgmt-action-link"
                            onClick={() => navigate("/exams/" + exam._id + "/analytics")}
                          >
                            Analytics
                          </button>
                          <button
                            className="exam-mgmt-action-link exam-mgmt-action-danger"
                            onClick={() => deleteExam(exam)}
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

          <div className="exam-mgmt-pagination">
            <button
              className="exam-mgmt-btn exam-mgmt-btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span className="exam-mgmt-page-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="exam-mgmt-btn exam-mgmt-btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}

      {isModalOpen && (
        <ExamFormModal mode={modalMode} exam={selectedExam} onClose={closeModal} onSaved={handleModalSaved} />
      )}
    </div>
  );
}

export default ExamManagement;
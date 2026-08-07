import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./coursemanagement.css";
import CourseFormModal from "./courseformmodal";

function CourseManagement() {
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
  var [courses, setCourses] = useState([]);
  var [total, setTotal] = useState(0);
  var [totalPages, setTotalPages] = useState(1);
  var [page, setPage] = useState(1);
  var limit = 8;
  var [searchInput, setSearchInput] = useState("");
  var [search, setSearch] = useState("");
  var [statusFilter, setStatusFilter] = useState("");
  var [batchFilter, setBatchFilter] = useState("");
  var [isLoading, setIsLoading] = useState(true);
  var [errorMessage, setErrorMessage] = useState("");
  var [actionMessage, setActionMessage] = useState("");
  var [isModalOpen, setIsModalOpen] = useState(false);
  var [modalMode, setModalMode] = useState("add");
  var [selectedCourse, setSelectedCourse] = useState(null);
  var [stats, setStats] = useState(null);

  function getToken() {
    return localStorage.getItem("token");
  }

  function fetchStats() {
    fetch("/api/admin/courses/stats", {
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
        console.error("Error fetching course stats:", error);
      });
  }

  function fetchCourses() {
    setIsLoading(true);
    setErrorMessage("");
    var queryParams = [];
    queryParams.push("page=" + page);
    queryParams.push("limit=" + limit);
    if (search !== "") queryParams.push("search=" + encodeURIComponent(search));
    if (statusFilter !== "") queryParams.push("status=" + statusFilter);
    if (batchFilter !== "") queryParams.push("batch=" + encodeURIComponent(batchFilter));

    var url = "/api/admin/courses?" + queryParams.join("&");

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
          setCourses(data.courses);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        } else {
          setErrorMessage(data.message || "Failed to load courses.");
        }
      })
      .catch(function (error) {
        console.error("Error fetching courses:", error);
        setErrorMessage("Server or network error. Is the backend running?");
      })
      .finally(function () {
        setIsLoading(false);
      });
  }

  useEffect(
    function () {
      fetchCourses();
    },
    [page, search, statusFilter, batchFilter],
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

  function handleBatchFilterChange(e) {
    setPage(1);
    setBatchFilter(e.target.value);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setBatchFilter("");
    setPage(1);
  }

  function openAddModal() {
    setModalMode("add");
    setSelectedCourse(null);
    setIsModalOpen(true);
  }

  function openEditModal(course) {
    setModalMode("edit");
    setSelectedCourse(course);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSelectedCourse(null);
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
    fetchCourses();
    fetchStats();
  }

  async function toggleArchive(course) {
    var newStatus = course.status === "Active" ? "Archived" : "Active";
    var confirmToggle = window.confirm(
      newStatus === "Archived"
        ? 'Archive "' + course.title + '"? It will be hidden from active course lists.'
        : 'Restore "' + course.title + '" to Active?',
    );
    if (confirmToggle !== true) return;

    try {
      var response = await fetch("/api/admin/courses/" + course._id + "/archive", {
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
        fetchCourses();
        fetchStats();
      } else {
        alert(data.message || "Failed to update course status.");
      }
    } catch (error) {
      console.error("Error archiving course:", error);
      alert("Failed to update course status. Please try again.");
    }
  }

  async function deleteCourse(course) {
    var confirmDelete = window.confirm(
      'Are you sure you want to permanently delete "' + course.title + '"?',
    );
    if (confirmDelete !== true) return;

    try {
      var response = await fetch("/api/admin/courses/" + course._id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + getToken() },
      });
      var data = await response.json();
      if (data.success) {
        showActionMessage(data.message);
        if (courses.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          fetchCourses();
        }
        fetchStats();
      } else {
        alert(data.message || "Failed to delete course.");
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Failed to delete course. Please try again.");
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "-";
    var d = new Date(dateString);
    return d.toLocaleDateString();
  }

  return (
    <div className="course-mgmt-page">
      <div className="course-mgmt-header">
        <div>
          <h1>Course Management</h1>
          <p className="course-mgmt-subtitle">
            {total} total course{total === 1 ? "" : "s"}
          </p>
        </div>
        <div className="course-mgmt-header-actions">
          <button className="course-mgmt-btn course-mgmt-btn-secondary" onClick={() => navigate("/admin-dashboard")}>
            Back to Dashboard
          </button>
          <button className="course-mgmt-btn course-mgmt-btn-primary" onClick={openAddModal}>
            + Add Course
          </button>
        </div>
      </div>

      {actionMessage !== "" && <div className="course-mgmt-toast">{actionMessage}</div>}

      {stats !== null && (
        <div className="course-mgmt-stats-row">
          <div className="course-mgmt-stat-card">
            <span className="course-mgmt-stat-number">{stats.totalCourses}</span>
            <span className="course-mgmt-stat-label">Total Courses</span>
          </div>
          <div className="course-mgmt-stat-card">
            <span className="course-mgmt-stat-number">{stats.activeCourses}</span>
            <span className="course-mgmt-stat-label">Active</span>
          </div>
          <div className="course-mgmt-stat-card">
            <span className="course-mgmt-stat-number">{stats.archivedCourses}</span>
            <span className="course-mgmt-stat-label">Archived</span>
          </div>
          <div className="course-mgmt-stat-card">
            <span className="course-mgmt-stat-number">{stats.unassignedCourses}</span>
            <span className="course-mgmt-stat-label">Unassigned</span>
          </div>
          <div className="course-mgmt-stat-card">
            <span className="course-mgmt-stat-number">{stats.totalEnrolledStudents}</span>
            <span className="course-mgmt-stat-label">Enrolled Students</span>
          </div>
        </div>
      )}

      <div className="course-mgmt-filters">
        <form className="course-mgmt-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search by title, code or trainer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="course-mgmt-search-input"
          />
          <button type="submit" className="course-mgmt-btn course-mgmt-btn-secondary">
            Search
          </button>
        </form>

        <select value={statusFilter} onChange={handleStatusFilterChange} className="course-mgmt-select">
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Archived">Archived</option>
        </select>

        <input
          type="text"
          placeholder="Filter by batch..."
          value={batchFilter}
          onChange={handleBatchFilterChange}
          className="course-mgmt-select"
        />

        {(search !== "" || statusFilter !== "" || batchFilter !== "") && (
          <button className="course-mgmt-btn course-mgmt-btn-text" onClick={clearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {isLoading && <div className="course-mgmt-status course-mgmt-loading">Loading courses...</div>}
      {!isLoading && errorMessage !== "" && (
        <div className="course-mgmt-status course-mgmt-error">{errorMessage}</div>
      )}

      {!isLoading && errorMessage === "" && (
        <>
          <div className="course-mgmt-table-wrap">
            <table className="course-mgmt-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Code</th>
                  <th>Trainer</th>
                  <th>Batch</th>
                  <th>Duration</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 && (
                  <tr>
                    <td colSpan="8" className="course-mgmt-empty-row">
                      No courses found.
                    </td>
                  </tr>
                )}
                {courses.map(function (course) {
                  return (
                    <tr key={course._id}>
                      <td>
                        <button
                          className="course-mgmt-title-link"
                          onClick={() => navigate("/admin/courses/" + course._id)}
                        >
                          {course.title}
                        </button>
                      </td>
                      <td>{course.code || "-"}</td>
                      <td>{course.trainerName || "Unassigned"}</td>
<td>
  {course.linkedBatchNames && course.linkedBatchNames.length > 0
    ? course.linkedBatchNames.join(", ")
    : "-"}
</td>                      <td>{course.duration || "-"}</td>
                      <td>{formatDate(course.createdAt)}</td>
                      <td>
                        <span
                          className={
                            "course-mgmt-status-badge " +
                            (course.status === "Active"
                              ? "course-mgmt-status-active"
                              : "course-mgmt-status-archived")
                          }
                        >
                          {course.status}
                        </span>
                      </td>
                      <td>
                        <div className="course-mgmt-row-actions">
                          <button className="course-mgmt-action-link" onClick={() => openEditModal(course)}>
                            Edit
                          </button>
                          <button className="course-mgmt-action-link" onClick={() => toggleArchive(course)}>
                            {course.status === "Active" ? "Archive" : "Restore"}
                          </button>
                          <button
                            className="course-mgmt-action-link course-mgmt-action-danger"
                            onClick={() => deleteCourse(course)}
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

          <div className="course-mgmt-pagination">
            <button
              className="course-mgmt-btn course-mgmt-btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span className="course-mgmt-page-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="course-mgmt-btn course-mgmt-btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}

      {isModalOpen && (
        <CourseFormModal mode={modalMode} course={selectedCourse} onClose={closeModal} onSaved={handleModalSaved} />
      )}
    </div>
  );
}

export default CourseManagement;
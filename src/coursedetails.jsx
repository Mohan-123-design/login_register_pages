import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./coursedetails.css";
import CourseFormModal from "./courseformmodal";

function CourseDetails() {
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
  var params = useParams();
  var courseId = params.id;

  var [course, setCourse] = useState(null);
  var [enrolledStudents, setEnrolledStudents] = useState([]);
  var [isLoading, setIsLoading] = useState(true);
  var [errorMessage, setErrorMessage] = useState("");
  var [isModalOpen, setIsModalOpen] = useState(false);
  var [actionMessage, setActionMessage] = useState("");

  function getToken() {
    return localStorage.getItem("token");
  }

  function fetchCourse() {
    setIsLoading(true);
    setErrorMessage("");
    fetch("/api/admin/courses/" + courseId, {
      headers: { Authorization: "Bearer " + getToken() },
    })
      .then(function (response) {
        if (response.status === 401 || response.status === 403) {
          navigate("/access-denied");
          return null;
        }
        if (response.status === 404) {
          setErrorMessage("Course not found.");
          return null;
        }
        return response.json();
      })
      .then(function (data) {
        if (data === null) return;
        if (data.success) {
          setCourse(data.course);
          setEnrolledStudents(data.enrolledStudents);
        } else {
          setErrorMessage(data.message || "Failed to load course.");
        }
      })
      .catch(function (error) {
        console.error("Error fetching course:", error);
        setErrorMessage("Server or network error. Is the backend running?");
      })
      .finally(function () {
        setIsLoading(false);
      });
  }

  useEffect(
    function () {
      fetchCourse();
    },
    [courseId],
  );

  function showActionMessage(message) {
    setActionMessage(message);
    setTimeout(function () {
      setActionMessage("");
    }, 3500);
  }

  function handleModalSaved(message) {
    setIsModalOpen(false);
    showActionMessage(message);
    fetchCourse();
  }

  async function toggleArchive() {
    var newStatus = course.status === "Active" ? "Archived" : "Active";
    var confirmToggle = window.confirm(
      newStatus === "Archived"
        ? 'Archive "' + course.title + '"?'
        : 'Restore "' + course.title + '" to Active?',
    );
    if (confirmToggle !== true) return;

    try {
      var response = await fetch("/api/admin/courses/" + courseId + "/archive", {
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
        fetchCourse();
      } else {
        alert(data.message || "Failed to update course status.");
      }
    } catch (error) {
      console.error("Error archiving course:", error);
      alert("Failed to update course status. Please try again.");
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "-";
    var d = new Date(dateString);
    return d.toLocaleDateString();
  }

  return (
    <div className="course-details-page">
      <div className="course-details-header">
        <button className="course-details-btn course-details-btn-secondary" onClick={() => navigate("/admin/courses")}>
          Back to Courses
        </button>
      </div>

      {actionMessage !== "" && <div className="course-details-toast">{actionMessage}</div>}

      {isLoading && <div className="course-details-status course-details-loading">Loading course...</div>}
      {!isLoading && errorMessage !== "" && (
        <div className="course-details-status course-details-error">{errorMessage}</div>
      )}

      {!isLoading && errorMessage === "" && course !== null && (
        <>
          <div className="course-details-card">
            <div className="course-details-title-row">
              <div>
                <h1>{course.title}</h1>
                <p className="course-details-subtitle">{course.code || "No course code"}</p>
              </div>
              <span
                className={
                  "course-details-status-badge " +
                  (course.status === "Active" ? "course-details-status-active" : "course-details-status-archived")
                }
              >
                {course.status}
              </span>
            </div>

            {course.description && <p className="course-details-description">{course.description}</p>}

            <div className="course-details-meta-grid">
              <div>
                <span className="course-details-meta-label">Trainer</span>
                <span className="course-details-meta-value">{course.trainerName || "Unassigned"}</span>
              </div>
              <div>
                <span className="course-details-meta-label">Batch</span>
                <span className="course-details-meta-value">{course.linkedBatchNames && course.linkedBatchNames.length > 0
    ? course.linkedBatchNames.join(", ")
    : "-"}</span>
              </div>
              <div>
                <span className="course-details-meta-label">Category</span>
                <span className="course-details-meta-value">{course.category || "-"}</span>
              </div>
              <div>
                <span className="course-details-meta-label">Duration</span>
                <span className="course-details-meta-value">{course.duration || "-"}</span>
              </div>
              <div>
                <span className="course-details-meta-label">Start Date</span>
                <span className="course-details-meta-value">{formatDate(course.startDate)}</span>
              </div>
              <div>
                <span className="course-details-meta-label">Enrolled Students</span>
                <span className="course-details-meta-value">{enrolledStudents.length}</span>
              </div>
            </div>

            <div className="course-details-actions">
              <button className="course-details-btn course-details-btn-primary" onClick={() => setIsModalOpen(true)}>
                Edit Course
              </button>
              <button className="course-details-btn course-details-btn-secondary" onClick={toggleArchive}>
                {course.status === "Active" ? "Archive Course" : "Restore Course"}
              </button>
            </div>
          </div>

          <div className="course-details-card">
            <h2>Enrolled Students ({enrolledStudents.length})</h2>
            {enrolledStudents.length === 0 && (
              <p className="course-details-empty">
                No students found in batch {course.batch || "-"}. 
              </p>
            )}
            {enrolledStudents.length > 0 && (
              <div className="course-details-table-wrap">
                <table className="course-details-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledStudents.map(function (student) {
                      return (
                        <tr key={student._id}>
                          <td>{student.firstName + " " + student.lastName}</td>
                          <td>{student.email}</td>
                          <td>{student.status}</td>
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

      {isModalOpen && (
        <CourseFormModal mode="edit" course={course} onClose={() => setIsModalOpen(false)} onSaved={handleModalSaved} />
      )}
    </div>
  );
}

export default CourseDetails;
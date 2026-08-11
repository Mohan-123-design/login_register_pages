import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./studentexams.css";

function StudentExams() {
  var loggedInUser = localStorage.getItem("loggedInUser");
  if (loggedInUser === null) {
    window.location.href = "/access-denied";
    return null;
  }
  var currentUser = JSON.parse(loggedInUser);
  if (currentUser.role !== "Student" && currentUser.role !== "Employee") {
    window.location.href = "/access-denied";
    return null;
  }

  var navigate = useNavigate();
  var [exams, setExams] = useState([]);
  var [isLoading, setIsLoading] = useState(true);
  var [errorMessage, setErrorMessage] = useState("");

  function getToken() {
    return localStorage.getItem("token");
  }

  useEffect(function () {
    setIsLoading(true);
    setErrorMessage("");
    fetch("/api/exams?limit=100", {
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
  }, []);

  function formatDate(dateString) {
    if (!dateString) return "-";
    var d = new Date(dateString);
    return d.toLocaleString();
  }

  function statusClass(status) {
    if (status === "Published") return "student-exam-status-published";
    if (status === "Ongoing") return "student-exam-status-ongoing";
    if (status === "Completed") return "student-exam-status-completed";
    return "";
  }

  function openExam(exam) {
    if (exam.myCompletionStatus === "Completed") return;
    if (exam.effectiveStatus !== "Ongoing") return;
    navigate("/exams/" + exam._id + "/take");
  }

  function isClickable(exam) {
    return exam.effectiveStatus === "Ongoing" && exam.myCompletionStatus !== "Completed";
  }

  return (
    <div className="student-exam-page">
      <div className="student-exam-header">
        <div>
          <h1>My Exams</h1>
          <p className="student-exam-subtitle">Exams published for your batch</p>
        </div>
        <button className="student-exam-btn" onClick={() => navigate("/student-dashboard")}>
          Back to Dashboard
        </button>
      </div>

      {isLoading && <div className="student-exam-status-msg student-exam-loading">Loading exams...</div>}
      {!isLoading && errorMessage !== "" && (
        <div className="student-exam-status-msg student-exam-error">{errorMessage}</div>
      )}

      {!isLoading && errorMessage === "" && (
        <div className="student-exam-list">
          {exams.length === 0 && <div className="student-exam-empty">No exams available right now.</div>}
          {exams.map(function (exam) {
            var clickable = isClickable(exam);
            return (
              <div
                className={"student-exam-card" + (clickable ? " student-exam-card-clickable" : "")}
                key={exam._id}
                onClick={() => openExam(exam)}
              >
                <div className="student-exam-card-main">
                  <h3>{exam.title}</h3>
                  <p className="student-exam-meta">
                    {exam.courseName || "General"} • {formatDate(exam.examDate)} • {exam.duration} min •{" "}
                    {exam.totalMarks} marks
                  </p>
                  {clickable && <p className="student-exam-cta">Click to take this exam →</p>}
                </div>
                <div className="student-exam-card-side">
                  <span className={"student-exam-badge " + statusClass(exam.effectiveStatus)}>
                    {exam.effectiveStatus}
                  </span>
                  {exam.myCompletionStatus === "Completed" ? (
                    <span className="student-exam-attempt-status">
                      Attempted • {exam.myObtainedMarks}/{exam.totalMarks} ({exam.myPassStatus})
                    </span>
                  ) : (
                    <span className="student-exam-attempt-status">Not Attempted</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StudentExams;
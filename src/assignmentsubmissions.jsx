import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resolveFileUrl } from "./config";
import "./assignmentsubmissions.css";

function AssignmentSubmissions() {
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

  var params = useParams();
  var navigate = useNavigate();
  var assignmentId = params.id;
  var [assignment, setAssignment] = useState(null);
  var [submissions, setSubmissions] = useState([]);
  var [overview, setOverview] = useState(null);
  var [statusFilter, setStatusFilter] = useState("");
  var [isLoading, setIsLoading] = useState(true);
  var [errorMessage, setErrorMessage] = useState("");
  var [actionMessage, setActionMessage] = useState("");
  var [gradingRow, setGradingRow] = useState(null);
  var [obtainedMarks, setObtainedMarks] = useState("");
  var [feedback, setFeedback] = useState("");
  var [waivePenalty, setWaivePenalty] = useState(false);
  var [gradeError, setGradeError] = useState("");
  var [isSavingGrade, setIsSavingGrade] = useState(false);

  function getToken() {
    return localStorage.getItem("token");
  }

  function fetchSubmissions() {
    setIsLoading(true);
    setErrorMessage("");
    var url = "/api/assignments/" + assignmentId + "/submissions" + (statusFilter ? "?status=" + statusFilter : "");
    fetch(url, { headers: { Authorization: "Bearer " + getToken() } })
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
          setAssignment(data.assignment);
          setSubmissions(data.submissions);
        } else {
          setErrorMessage(data.message || "Failed to load submissions.");
        }
      })
      .catch(function (error) {
        console.error("Error fetching submissions:", error);
        setErrorMessage("Server or network error. Is the backend running?");
      })
      .finally(function () {
        setIsLoading(false);
      });
  }

  function fetchOverview() {
    fetch("/api/assignments/" + assignmentId + "/overview", {
      headers: { Authorization: "Bearer " + getToken() },
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) setOverview(data.overview);
      })
      .catch(function (error) {
        console.error("Error fetching overview:", error);
      });
  }

  useEffect(
    function () {
      fetchSubmissions();
      fetchOverview();
    },
    [statusFilter],
  );

  function formatDate(dateString) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  }

  function showActionMessage(message) {
    setActionMessage(message);
    setTimeout(function () {
      setActionMessage("");
    }, 3500);
  }

  function statusClass(status) {
    if (status === "Not Submitted") return "assign-sub-status-notsubmitted";
    if (status === "Submitted") return "assign-sub-status-submitted";
    if (status === "Late") return "assign-sub-status-late";
    if (status === "Graded") return "assign-sub-status-graded";
    if (status === "Pending Evaluation") return "assign-sub-status-pending";
    return "";
  }

  function openGradeModal(row) {
    setGradingRow(row);
    setObtainedMarks(row.obtainedMarks !== null && row.obtainedMarks !== undefined ? row.obtainedMarks : "");
    setFeedback(row.feedback || "");
    setWaivePenalty(row.penaltyWaived === true);
    setGradeError("");
  }

  function closeGradeModal() {
    setGradingRow(null);
  }

  async function submitGrade(e) {
    e.preventDefault();
    setGradeError("");
    if (obtainedMarks === "" || Number(obtainedMarks) < 0) {
      setGradeError("Enter a valid, non-negative mark");
      return;
    }
    if (Number(obtainedMarks) > assignment.totalMarks) {
      setGradeError("Obtained marks cannot exceed total marks (" + assignment.totalMarks + ")");
      return;
    }
    setIsSavingGrade(true);
    try {
      var response = await fetch("/api/assignments/" + assignmentId + "/grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getToken(),
        },
        body: JSON.stringify({
          studentEmail: gradingRow.studentEmail,
          obtainedMarks: Number(obtainedMarks),
          feedback: feedback,
          waivePenalty: waivePenalty,
        }),
      });
      var data = await response.json();
      if (data.success) {
        showActionMessage("Submission graded successfully");
        closeGradeModal();
        fetchSubmissions();
        fetchOverview();
      } else {
        setGradeError(data.message || "Failed to save grade");
      }
    } catch (error) {
      console.error("Error grading submission:", error);
      setGradeError("Server or network error. Please try again.");
    } finally {
      setIsSavingGrade(false);
    }
  }

  return (
    <div className="assign-sub-page">
      <div className="assign-sub-header">
        <div>
          <h1>{assignment ? assignment.title : "Submissions"}</h1>
          {assignment && (
            <p className="assign-sub-subtitle">
              {assignment.courseName || "No course"} • {assignment.batchName || "No batch"} • Due{" "}
              {formatDate(assignment.dueDate)} • {assignment.totalMarks} marks
            </p>
          )}
        </div>
        <button className="assign-sub-btn assign-sub-btn-secondary" onClick={() => navigate("/admin/assignments")}>
          Back to Assignments
        </button>
      </div>

      {actionMessage !== "" && <div className="assign-sub-toast">{actionMessage}</div>}

      {overview && (
        <div className="assign-sub-overview-grid">
          <div className="assign-sub-overview-card">
            <div className="assign-sub-overview-value">{overview.totalStudents}</div>
            <div className="assign-sub-overview-label">Total Students</div>
          </div>
          <div className="assign-sub-overview-card">
            <div className="assign-sub-overview-value">{overview.totalSubmissions}</div>
            <div className="assign-sub-overview-label">Total Submissions</div>
          </div>
          <div className="assign-sub-overview-card">
            <div className="assign-sub-overview-value">{overview.pendingSubmissions}</div>
            <div className="assign-sub-overview-label">Pending Evaluation</div>
          </div>
          <div className="assign-sub-overview-card">
            <div className="assign-sub-overview-value">{overview.completedSubmissions}</div>
            <div className="assign-sub-overview-label">Graded</div>
          </div>
          <div className="assign-sub-overview-card">
            <div className="assign-sub-overview-value">{overview.lateSubmissions}</div>
            <div className="assign-sub-overview-label">Late Submissions</div>
          </div>
          <div className="assign-sub-overview-card">
            <div className="assign-sub-overview-value">{overview.notSubmittedCount}</div>
            <div className="assign-sub-overview-label">Not Submitted</div>
          </div>
          <div className="assign-sub-overview-card">
            <div className="assign-sub-overview-value">{overview.averageMarks}</div>
            <div className="assign-sub-overview-label">Average Marks</div>
          </div>
          <div className="assign-sub-overview-card">
            <div className="assign-sub-overview-value">{overview.submissionPercentage}%</div>
            <div className="assign-sub-overview-label">Submission %</div>
          </div>
        </div>
      )}

      <div className="assign-sub-filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="assign-sub-select">
          <option value="">All Statuses</option>
          <option value="Not Submitted">Not Submitted</option>
          <option value="Submitted">Submitted</option>
          <option value="Late">Late</option>
          <option value="Pending Evaluation">Pending Evaluation</option>
          <option value="Graded">Graded</option>
        </select>
      </div>

      {isLoading && <div className="assign-sub-status-msg assign-sub-loading">Loading submissions...</div>}
      {!isLoading && errorMessage !== "" && (
        <div className="assign-sub-status-msg assign-sub-error">{errorMessage}</div>
      )}

      {!isLoading && errorMessage === "" && (
        <div className="assign-sub-table-wrap">
          <table className="assign-sub-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Submitted At</th>
                <th>Late?</th>
                <th>Status</th>
                <th>Obtained / Total</th>
                <th>Grade</th>
                <th>Evaluation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 && (
                <tr>
                  <td colSpan="8" className="assign-sub-empty-row">
                    No students found for this assignments batch.
                  </td>
                </tr>
              )}
              {submissions.map(function (row) {
                return (
                  <tr key={row.studentEmail}>
                    <td>
                      {row.studentName || row.studentEmail}
                      <div className="assign-sub-email">{row.studentEmail}</div>
                    </td>
                    <td>{formatDate(row.submittedAt)}</td>
                    <td>
                      {row.isLate ? <span className="assign-sub-late-flag">Late</span> : "-"}
                    </td>
                    <td>
                      <span className={"assign-sub-status-badge " + statusClass(row.displayStatus)}>
                        {row.displayStatus}
                      </span>
                    </td>
                    <td>
                      {row.obtainedMarks !== null && row.obtainedMarks !== undefined
                        ? row.obtainedMarks + " / " + row.totalMarks
                        : "- / " + row.totalMarks}
                    </td>
                    <td>{row.grade || "-"}</td>
                    <td>{row.evaluationStatus || "-"}</td>
                    <td>
                      <div className="assign-sub-row-actions">
                        <button
                          className="assign-sub-action-link"
                          disabled={row.submissionStatus === "Not Submitted"}
                          onClick={() => openGradeModal(row)}
                        >
                          {row.evaluationStatus === "Graded" ? "Re-grade" : "Grade"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {gradingRow && assignment && (
        <div className="assign-modal-overlay" onClick={closeGradeModal}>
          <div className="assign-modal-box assign-sub-grade-box" onClick={(e) => e.stopPropagation()}>
            <div className="assign-modal-header">
              <h2>Grade: {gradingRow.studentName || gradingRow.studentEmail}</h2>
              <button className="assign-modal-close" onClick={closeGradeModal} aria-label="Close">
                ×
              </button>
            </div>
            <form onSubmit={submitGrade} className="assign-modal-form">
              {gradeError !== "" && <div className="assign-modal-error">{gradeError}</div>}

              {gradingRow.answerText && (
                <div className="assign-sub-answer-preview">
                  <label>Students Answer</label>
                  <p>{gradingRow.answerText}</p>
                </div>
              )}
              {gradingRow.submittedFiles && gradingRow.submittedFiles.length > 0 && (
                <div className="assign-sub-answer-preview">
                  <label>Uploaded Topic Result Documents</label>
                  <ul>
{gradingRow.submittedFiles.map(function (f, i) {
                      return (
                        <li key={i}>
                          <a href={resolveFileUrl(f.fileUrl)} target="_blank" rel="noreferrer">
                            {f.fileName || f.fileUrl}
                          </a>{" "}
                          <a className="assign-sub-view-link" href={resolveFileUrl(f.fileUrl)} target="_blank" rel="noreferrer">
                            (View)
                          </a>
                        </li>
                      );
                    })}                  </ul>
                </div>
              )}
              {gradingRow.referredLinks && gradingRow.referredLinks.length > 0 && (
                <div className="assign-sub-answer-preview">
                  <label>Referred Links</label>
                  <ul>
                    {gradingRow.referredLinks.map(function (link, i) {
                      return (
                        <li key={i}>
                          <a href={link} target="_blank" rel="noreferrer">
                            {link}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {gradingRow.isLate && assignment.latePenaltyPercent > 0 && (
                <div className="assign-sub-late-note">
                  This submission was Late. A {assignment.latePenaltyPercent}% penalty will be applied.
                </div>
              )}

              <div className="assign-modal-row">
                <div className="assign-modal-field">
                  <label>Obtained Marks (out of {assignment.totalMarks}) *</label>
                  <input
                    type="number"
                    min="0"
                    max={assignment.totalMarks}
                    value={obtainedMarks}
                    onChange={(e) => setObtainedMarks(e.target.value)}
                  />
                </div>
                {gradingRow.isLate && assignment.latePenaltyPercent > 0 && (
                  <div className="assign-modal-field assign-sub-waive-field">
                    <label>
                      <input
                        type="checkbox"
                        checked={waivePenalty}
                        onChange={(e) => setWaivePenalty(e.target.checked)}
                      />
                      &nbsp;Waive late penalty
                    </label>
                  </div>
                )}
              </div>

              <div className="assign-modal-field">
                <label>Feedback</label>
                <textarea rows="3" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
              </div>

              <div className="assign-modal-actions">
                <button type="button" className="assign-modal-btn assign-modal-btn-secondary" onClick={closeGradeModal}>
                  Cancel
                </button>
                <button type="submit" className="assign-modal-btn assign-modal-btn-primary" disabled={isSavingGrade}>
                  {isSavingGrade ? "Saving..." : "Save Grade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssignmentSubmissions;
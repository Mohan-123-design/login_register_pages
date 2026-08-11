import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./examresultsummary.css";

function ExamResultSummary() {
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
  var examId = params.id;

  var [exam, setExam] = useState(null);
  var [results, setResults] = useState([]);
  var [isLoading, setIsLoading] = useState(true);
  var [errorMessage, setErrorMessage] = useState("");
  var [actionMessage, setActionMessage] = useState("");
  var [editingEmail, setEditingEmail] = useState(null);
  var [marksInput, setMarksInput] = useState("");

  function getToken() {
    return localStorage.getItem("token");
  }

  function fetchSummary() {
    setIsLoading(true);
    setErrorMessage("");
    fetch("/api/exams/" + examId + "/results", {
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
          setExam(data.exam);
          setResults(data.results);
        } else {
          setErrorMessage(data.message || "Failed to load results.");
        }
      })
      .catch(function (error) {
        console.error("Error fetching result summary:", error);
        setErrorMessage("Server or network error. Is the backend running?");
      })
      .finally(function () {
        setIsLoading(false);
      });
  }

  useEffect(function () {
    fetchSummary();
  }, []);

  function startEditing(row) {
    setEditingEmail(row.studentEmail);
    setMarksInput(row.completionStatus === "Completed" ? String(row.obtainedMarks) : "");
  }

  function cancelEditing() {
    setEditingEmail(null);
    setMarksInput("");
  }

  async function saveMarks(row) {
    if (marksInput === "" || isNaN(Number(marksInput)) || Number(marksInput) < 0) {
      alert("Please enter a valid non-negative number for marks.");
      return;
    }
    try {
      var response = await fetch("/api/exams/" + examId + "/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getToken(),
        },
        body: JSON.stringify({
          studentEmail: row.studentEmail,
          studentName: row.studentName,
          obtainedMarks: Number(marksInput),
        }),
      });
      var data = await response.json();
      if (data.success) {
        setActionMessage("Result saved for " + (row.studentName || row.studentEmail));
        setTimeout(function () {
          setActionMessage("");
        }, 3000);
        cancelEditing();
        fetchSummary();
      } else {
        alert(data.message || "Failed to save result.");
      }
    } catch (error) {
      console.error("Error saving result:", error);
      alert("Failed to save result. Please try again.");
    }
  }

  function statusClass(status) {
    if (status === "Pass") return "exam-result-pass";
    if (status === "Fail") return "exam-result-fail";
    return "";
  }

  return (
    <div className="exam-result-page">
      <div className="exam-result-header">
        <div>
          <h1>Result Summary</h1>
          {exam !== null && <p className="exam-result-subtitle">{exam.title}</p>}
        </div>
        <div className="exam-result-header-actions">
          <button className="exam-result-btn exam-result-btn-secondary" onClick={() => navigate("/admin/exams")}>
            Back to Exams
          </button>
          {exam !== null && (
            <button
              className="exam-result-btn exam-result-btn-secondary"
              onClick={() => navigate("/exams/" + examId + "/analytics")}
            >
              View Analytics
            </button>
          )}
        </div>
      </div>

      {actionMessage !== "" && <div className="exam-result-toast">{actionMessage}</div>}

      {isLoading && <div className="exam-result-status-msg exam-result-loading">Loading results...</div>}
      {!isLoading && errorMessage !== "" && (
        <div className="exam-result-status-msg exam-result-error">{errorMessage}</div>
      )}

      {!isLoading && errorMessage === "" && (
        <div className="exam-result-table-wrap">
          <table className="exam-result-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Total Marks</th>
                <th>Obtained Marks</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Pass/Fail</th>
                <th>Completion</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 && (
                <tr>
                  <td colSpan="9" className="exam-result-empty-row">
                    No students found for this exam batch.
                  </td>
                </tr>
              )}
              {results.map(function (row) {
                var isEditingRow = editingEmail === row.studentEmail;
                return (
                  <tr key={row.studentEmail}>
                    <td>{row.studentName || "-"}</td>
                    <td>{row.studentEmail}</td>
                    <td>{row.totalMarks}</td>
                    <td>
                      {isEditingRow ? (
                        <input
                          type="number"
                          min="0"
                          className="exam-result-marks-input"
                          value={marksInput}
                          onChange={(e) => setMarksInput(e.target.value)}
                        />
                      ) : row.completionStatus === "Completed" ? (
                        row.obtainedMarks
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{row.completionStatus === "Completed" ? row.percentage + "%" : "-"}</td>
                    <td>{row.completionStatus === "Completed" ? row.grade : "-"}</td>
                    <td>
                      {row.completionStatus === "Completed" ? (
                        <span className={"exam-result-badge " + statusClass(row.passStatus)}>{row.passStatus}</span>
                      ) : (
                        <span className="exam-result-badge">-</span>
                      )}
                    </td>
                    <td>{row.completionStatus}</td>
                    <td>
                      {isEditingRow ? (
                        <div className="exam-result-row-actions">
                          <button className="exam-result-action-link" onClick={() => saveMarks(row)}>
                            Save
                          </button>
                          <button className="exam-result-action-link" onClick={cancelEditing}>
                            Cancel
                          </button>
                        </div>
                      ) : row.completionStatus === "Completed" ? (
                        <button className="exam-result-action-link" onClick={() => startEditing(row)}>
                          Adjust Marks
                        </button>
                      ) : (
                        <span className="exam-result-not-submitted" title="Marks can only be entered after the student submits the exam themselves">
                          Awaiting submission
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ExamResultSummary;
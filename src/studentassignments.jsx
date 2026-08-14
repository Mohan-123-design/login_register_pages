import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { resolveFileUrl } from "./config";
import "./studentassignments.css";

function blankLink() {
  return "";
}
function StudentAssignments() {
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
  var [assignments, setAssignments] = useState([]);
  var [isLoading, setIsLoading] = useState(true);
  var [errorMessage, setErrorMessage] = useState("");
  var [actionMessage, setActionMessage] = useState("");
  var [activeAssignment, setActiveAssignment] = useState(null);
  var [answerText, setAnswerText] = useState("");
var [submittedFiles, setSubmittedFiles] = useState([]);
  var [referredLinks, setReferredLinks] = useState([]);
  var [submitError, setSubmitError] = useState("");
  var [isSubmitting, setIsSubmitting] = useState(false);
  var [isUploadingFile, setIsUploadingFile] = useState(false);
  var [uploadError, setUploadError] = useState("");
  var fileInputRef = useRef(null);

  function getToken() {
    return localStorage.getItem("token");
  }

  function fetchAssignments() {
    setIsLoading(true);
    setErrorMessage("");
    fetch("/api/assignments?limit=100", {
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

  useEffect(function () {
    fetchAssignments();
  }, []);

  function formatDate(dateString) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  }

  function statusClass(status) {
    if (status === "Draft") return "student-assign-status-draft";
    if (status === "Published") return "student-assign-status-published";
    if (status === "Open") return "student-assign-status-open";
    if (status === "Closed") return "student-assign-status-closed";
    if (status === "Completed") return "student-assign-status-completed";
    return "";
  }

  function mySubmissionLabel(assignment) {
    if (assignment.mySubmissionStatus === "Not Submitted") return "Not Submitted";
    if (assignment.myEvaluationStatus === "Graded") {
      return "Graded (" + assignment.myObtainedMarks + "/" + assignment.totalMarks + ")";
    }
    return assignment.mySubmissionStatus + " • Pending Evaluation";
  }

  function showActionMessage(message) {
    setActionMessage(message);
    setTimeout(function () {
      setActionMessage("");
    }, 3500);
  }

  function openSubmitPanel(assignment) {
setActiveAssignment(assignment);
    setAnswerText("");
    setSubmittedFiles([]);
    setReferredLinks([]);
    setSubmitError("");
    setUploadError("");
  }
  function closeSubmitPanel() {
    setActiveAssignment(null);
  }

function handleChooseFileClick() {
    setUploadError("");
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  function handleFileSelected(e) {
    var pickedFile = e.target.files && e.target.files[0];
    if (!pickedFile) return;
    setUploadError("");
    setIsUploadingFile(true);

    var formData = new FormData();
    formData.append("file", pickedFile);

    fetch("/api/assignments/upload-file", {
      method: "POST",
      headers: { Authorization: "Bearer " + getToken() },
      body: formData,
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          setSubmittedFiles(function (prev) {
            return prev.concat([{ fileName: data.fileName, fileUrl: data.fileUrl }]);
          });
        } else {
          setUploadError(data.message || "Failed to upload file.");
        }
      })
      .catch(function (error) {
        console.error("Error uploading file:", error);
        setUploadError("Server or network error while uploading. Please try again.");
      })
      .finally(function () {
        setIsUploadingFile(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      });
  }

  function removeFile(index) {    setSubmittedFiles(function (prev) {
      return prev.filter(function (_, i) {
        return i !== index;
      });
    });
  }

  function updateLink(index, value) {
    setReferredLinks(function (prev) {
      var next = prev.slice();
      next[index] = value;
      return next;
    });
  }

  function addLink() {
    setReferredLinks(function (prev) {
      return prev.concat([blankLink()]);
    });
  }

  function removeLink(index) {
    setReferredLinks(function (prev) {
      return prev.filter(function (_, i) {
        return i !== index;
      });
    });
  }
function canSubmit(a) {
    return (a.status === "Open" || a.status === "Published") && a.myEvaluationStatus !== "Graded";
  }

  function submissionHint(a) {
    if (a.myEvaluationStatus === "Graded") return null;
    if (a.status === "Closed") return "Closed — no longer accepting submissions.";
    if (a.status === "Completed") return "This assignment is completed.";
    return null;
  }
  async function handleSubmitAssignment(e) {
    e.preventDefault();
    setSubmitError("");
    var cleanedFiles = submittedFiles.filter(function (f) {
      return f.fileName.trim() !== "" || f.fileUrl.trim() !== "";
    });
    var cleanedLinks = referredLinks
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l !== ""; });
    if (answerText.trim() === "" && cleanedFiles.length === 0 && cleanedLinks.length === 0) {
      setSubmitError("Please write an answer, upload a result document, or add a referred link.");
      return;
    }
    setIsSubmitting(true);
    try {
      var response = await fetch("/api/assignments/" + activeAssignment._id + "/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getToken(),
        },
        body: JSON.stringify({ answerText: answerText, submittedFiles: cleanedFiles, referredLinks: cleanedLinks }),
      });
      var data = await response.json();
      if (data.success) {
        showActionMessage(data.message);
        closeSubmitPanel();
        fetchAssignments();
      } else {
        setSubmitError(data.message || "Failed to submit assignment.");
      }
    } catch (error) {
      console.error("Error submitting assignment:", error);
      setSubmitError("Server or network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="student-assign-page">
      <div className="student-assign-header">
        <div>
          <h1>My Assignments</h1>
          <p className="student-assign-subtitle">View, submit and track marks for your assignments</p>
        </div>
        <button
          className="student-assign-btn student-assign-btn-secondary"
          onClick={() => navigate("/student-dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

      {actionMessage !== "" && <div className="student-assign-toast">{actionMessage}</div>}

      {isLoading && <div className="student-assign-status-msg">Loading assignments...</div>}
      {!isLoading && errorMessage !== "" && (
        <div className="student-assign-status-msg student-assign-error">{errorMessage}</div>
      )}

      {!isLoading && errorMessage === "" && (
        <div className="student-assign-list">
          {assignments.length === 0 && <div className="student-assign-empty">No assignments available yet.</div>}
          {assignments.map(function (assignment) {
            var canSubmit =
              assignment.status === "Open" &&
              !(assignment.myEvaluationStatus === "Graded");
            return (
              <div className="student-assign-card" key={assignment._id}>
                <div className="student-assign-card-top">
                  <h3>{assignment.title}</h3>
                  <span className={"student-assign-status-badge " + statusClass(assignment.status)}>
                    {assignment.status}
                  </span>
                </div>
                <p className="student-assign-meta">
                  {assignment.courseName || "No course"} • {assignment.batchName || "No batch"} • Due{" "}
                  <span className={assignment.isOverdue ? "student-assign-overdue" : ""}>
                    {formatDate(assignment.dueDate)}
                  </span>{" "}
                  • {assignment.totalMarks} marks
                </p>
                {assignment.description && <p className="student-assign-desc">{assignment.description}</p>}
                <p className="student-assign-my-status">Your status: {mySubmissionLabel(assignment)}</p>

                {assignment.topics && assignment.topics.length > 0 && (
                  <div className="student-assign-field">
                    <label>Research Topics</label>
                    <ol className="student-assign-question-list">
                      {assignment.topics.map(function (t, i) {
                        return (
                          <li key={i}>
                            {t.topicText}
                            {t.description ? " — " + t.description : ""}
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}

                {((assignment.attachments && assignment.attachments.length > 0) ||
                  (assignment.referenceLinks && assignment.referenceLinks.length > 0)) && (
                  <div className="student-assign-attachments">
                    {assignment.attachments &&
                      assignment.attachments.map(function (a, i) {
                        return (
<a key={"file-" + i} href={resolveFileUrl(a.fileUrl)} target="_blank" rel="noreferrer">                            📎 {a.fileName || a.fileUrl}
                          </a>
                        );
                      })}
                    {assignment.referenceLinks &&
                      assignment.referenceLinks.map(function (link, i) {
                        return (
                          <a key={"link-" + i} href={link} target="_blank" rel="noreferrer">
                            🔗 {link}
                          </a>
                        );
                      })}
                  </div>
                )}

                <div className="student-assign-card-actions">
                  {canSubmit && (
                    <button
                      className="student-assign-btn student-assign-btn-primary"
                      onClick={() => openSubmitPanel(assignment)}
                    >
                      {assignment.mySubmissionStatus === "Not Submitted" ? "Submit" : "Resubmit"}
                    </button>
                  )}
                  {submissionHint(assignment) !== null && (
                    <span className="student-assign-attempt-status">{submissionHint(assignment)}</span>
                  )}
                  {assignment.status !== "Open" && assignment.mySubmissionStatus === "Not Submitted" && (
                    <span className="student-assign-hint">
                      {assignment.status === "Draft" || assignment.status === "Published"
                        ? "Not open for submission yet"
                        : "Submission window closed"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeAssignment && (
        <div className="assign-modal-overlay" onClick={closeSubmitPanel}>
          <div className="assign-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="assign-modal-header">
              <h2>Submit: {activeAssignment.title}</h2>
              <button className="assign-modal-close" onClick={closeSubmitPanel} aria-label="Close">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitAssignment} className="assign-modal-form">
              {submitError !== "" && <div className="assign-modal-error">{submitError}</div>}

              {activeAssignment.instructions && (
                <div className="student-assign-instructions">
                  <label>Instructions</label>
                  <p>{activeAssignment.instructions}</p>
                </div>
              )}
          {activeAssignment.topics && activeAssignment.topics.length > 0 && (
            <div className="student-assign-field">
              <label>Research Topics</label>
              <ol className="student-assign-question-list">
                {activeAssignment.topics.map(function (t, i) {
                  return (
                    <li key={i}>
                      {t.topicText}
                      {t.description ? " — " + t.description : ""}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
              <div className="assign-modal-field">
                <label>Your Answer / Summary</label>
                <textarea
                  rows="5"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Summarize your findings here"
                />
              </div>

<div className="assign-modal-questions-header">
                <h3>Upload Topic Result Documents</h3>
                <span className="assign-modal-hint">Choose a file from your computer to attach it to your submission</span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileSelected}
              />

              {submittedFiles.map(function (f, index) {
                return (
                  <div className="assign-modal-attachment-row" key={index}>
                    <span className="assign-modal-uploaded-filename">📎 {f.fileName}</span>
                    <a
                      className="assign-modal-view-link"
                      href={resolveFileUrl(f.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                    <button type="button" className="assign-modal-remove-question" onClick={() => removeFile(index)}>
                      Remove
                    </button>
                  </div>
                );
})}

              <button
                type="button"
                className="assign-modal-add-question"
                onClick={handleChooseFileClick}
                disabled={isUploadingFile}
              >
                {isUploadingFile ? "Uploading..." : "+ Upload Document"}
              </button>
              {uploadError !== "" && <div className="assign-modal-error">{uploadError}</div>}
              <div className="assign-modal-questions-header">
                <h3>Referred Links</h3>
                <span className="assign-modal-hint">Add links to sources you referred to for this topic</span>
              </div>

              {referredLinks.map(function (link, index) {
                return (
                  <div className="assign-modal-attachment-row" key={index}>
                    <input
                      type="text"
                      placeholder="https://example.com/source"
                      value={link}
                      onChange={(e) => updateLink(index, e.target.value)}
                    />
                    {link && link.trim() !== "" && (
                      <a className="assign-modal-view-link" href={link} target="_blank" rel="noreferrer">
                        View
                      </a>
                    )}
                    <button type="button" className="assign-modal-remove-question" onClick={() => removeLink(index)}>
                      Remove
                    </button>
                  </div>
                );
              })}
              <button type="button" className="assign-modal-add-question" onClick={addLink}>
                + Add Referred Link
              </button>

              <div className="assign-modal-actions">
                <button type="button" className="assign-modal-btn assign-modal-btn-secondary" onClick={closeSubmitPanel}>
                  Cancel
                </button>
                <button type="submit" className="assign-modal-btn assign-modal-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentAssignments;
import { useState, useEffect } from "react";
import "./assignmentformmodal.css";

function blankAttachment() {
  return { fileName: "", fileUrl: "" };
}

function blankQuestion() {
  return { questionText: "", marks: "" };
}

function AssignmentFormModal({ mode, assignment, onClose, onSaved }) {
  var isEdit = mode === "edit";
  var [title, setTitle] = useState(isEdit ? assignment.title : "");
  var [dueDate, setDueDate] = useState(
    isEdit && assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : "",
  );
  var [totalMarks, setTotalMarks] = useState(isEdit ? assignment.totalMarks : "");
  var [description, setDescription] = useState(isEdit ? assignment.description || "" : "");
  var [instructions, setInstructions] = useState(isEdit ? assignment.instructions || "" : "");
  var [latePenaltyPercent, setLatePenaltyPercent] = useState(isEdit ? assignment.latePenaltyPercent || 0 : 0);
  var [courseId, setCourseId] = useState(isEdit && assignment.courseId ? assignment.courseId : "");
  var [batchId, setBatchId] = useState(isEdit && assignment.batchId ? assignment.batchId : "");
  var [courses, setCourses] = useState([]);
  var [batches, setBatches] = useState([]);
  var [attachments, setAttachments] = useState(
    isEdit && assignment.attachments && assignment.attachments.length > 0
      ? assignment.attachments.map(function (a) {
          return { fileName: a.fileName || "", fileUrl: a.fileUrl || "" };
        })
      : [],
  );
  var [questions, setQuestions] = useState(
    isEdit && assignment.questions && assignment.questions.length > 0
      ? assignment.questions.map(function (q) {
          return { questionText: q.questionText || "", marks: q.marks !== undefined && q.marks !== null ? String(q.marks) : "" };
        })
      : [],
  );
  var [errorMessage, setErrorMessage] = useState("");
  var [isSubmitting, setIsSubmitting] = useState(false);

  function getToken() {
    return localStorage.getItem("token");
  }

  useEffect(function () {
    fetch("/api/admin/courses?limit=200", {
      headers: { Authorization: "Bearer " + getToken() },
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) setCourses(data.courses);
      })
      .catch(function (error) {
        console.error("Error fetching courses:", error);
      });

    fetch("/api/admin/batches?limit=200", {
      headers: { Authorization: "Bearer " + getToken() },
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) setBatches(data.batches);
      })
      .catch(function (error) {
        console.error("Error fetching batches:", error);
      });
  }, []);

  function updateAttachment(index, field, value) {
    setAttachments(function (prev) {
      var next = prev.slice();
      next[index] = Object.assign({}, next[index]);
      next[index][field] = value;
      return next;
    });
  }

  function addAttachment() {
    setAttachments(function (prev) {
      return prev.concat([blankAttachment()]);
    });
  }

  function removeAttachment(index) {
    setAttachments(function (prev) {
      return prev.filter(function (_, i) {
        return i !== index;
      });
    });
  }

  function updateQuestion(index, field, value) {
    setQuestions(function (prev) {
      var next = prev.slice();
      next[index] = Object.assign({}, next[index]);
      next[index][field] = value;
      return next;
    });
  }

  function addQuestion() {
    setQuestions(function (prev) {
      return prev.concat([blankQuestion()]);
    });
  }

  function removeQuestion(index) {
    setQuestions(function (prev) {
      return prev.filter(function (_, i) {
        return i !== index;
      });
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");

    if (title.trim() === "") {
      setErrorMessage("Assignment title is required");
      return;
    }
    if (dueDate === "") {
      setErrorMessage("Due date & time is required");
      return;
    }
    if (!totalMarks || Number(totalMarks) <= 0) {
      setErrorMessage("Total marks must be a positive number");
      return;
    }
    var cleanedAttachments = attachments.filter(function (a) {
      return a.fileName.trim() !== "" || a.fileUrl.trim() !== "";
    });
    for (var i = 0; i < cleanedAttachments.length; i++) {
      if (cleanedAttachments[i].fileUrl.trim() === "") {
        setErrorMessage("Attachment " + (i + 1) + " needs a file URL/link");
        return;
      }
    }

    var cleanedQuestions = questions.filter(function (q) {
      return q.questionText.trim() !== "";
    });
    for (var j = 0; j < cleanedQuestions.length; j++) {
      if (cleanedQuestions[j].marks === "" || isNaN(Number(cleanedQuestions[j].marks)) || Number(cleanedQuestions[j].marks) < 0) {
        setErrorMessage("Question " + (j + 1) + " needs a valid, non-negative marks value");
        return;
      }
    }

    var payload = {
      title: title.trim(),
      dueDate: dueDate,
      totalMarks: Number(totalMarks),
      description: description,
      instructions: instructions,
      latePenaltyPercent: Number(latePenaltyPercent) || 0,
      courseId: courseId || null,
      batchId: batchId || null,
      attachments: cleanedAttachments,
      questions: cleanedQuestions.map(function (q) {
        return { questionText: q.questionText.trim(), marks: Number(q.marks) };
      }),
    };

    setIsSubmitting(true);
    try {
      var url = isEdit ? "/api/assignments/" + assignment._id : "/api/assignments";
      var method = isEdit ? "PUT" : "POST";
      var response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getToken(),
        },
        body: JSON.stringify(payload),
      });
      var data = await response.json();
      if (data.success) {
        onSaved(isEdit ? "Assignment updated successfully" : "Assignment created successfully");
      } else {
        setErrorMessage(data.message || "Failed to save assignment");
      }
    } catch (error) {
      console.error("Error saving assignment:", error);
      setErrorMessage("Server or network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="assign-modal-overlay" onClick={onClose}>
      <div className="assign-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="assign-modal-header">
          <h2>{isEdit ? "Edit Assignment" : "Create Assignment"}</h2>
          <button className="assign-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="assign-modal-form">
          {errorMessage !== "" && <div className="assign-modal-error">{errorMessage}</div>}

          <div className="assign-modal-row">
            <div className="assign-modal-field">
              <label>Assignment Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="assign-modal-field">
              <label>Due Date &amp; Time *</label>
              <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="assign-modal-row">
            <div className="assign-modal-field">
              <label>Course</label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">-- None --</option>
                {courses.map(function (c) {
                  return (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="assign-modal-field">
              <label>Batch</label>
              <select value={batchId} onChange={(e) => setBatchId(e.target.value)}>
                <option value="">-- None --</option>
                {batches.map(function (b) {
                  return (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="assign-modal-row">
            <div className="assign-modal-field">
              <label>Total Marks *</label>
              <input type="number" min="1" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} />
            </div>
            <div className="assign-modal-field">
              <label>Late Penalty (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={latePenaltyPercent}
                onChange={(e) => setLatePenaltyPercent(e.target.value)}
              />
              <span className="assign-modal-hint">Deducted from marks awarded to late submissions</span>
            </div>
          </div>

          <div className="assign-modal-field">
            <label>Description</label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this assignment about?"
            />
          </div>

          <div className="assign-modal-field">
            <label>Instructions</label>
            <textarea
              rows="3"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Instructions shown to students, e.g. submission format, word count..."
            />
          </div>

          <div className="assign-modal-questions-header">
            <h3>Questions</h3>
            <button type="button" className="assign-modal-add-question-btn" onClick={addQuestion}>
              + Add Question
            </button>
          </div>

          {questions.length === 0 && (
            <p className="assign-modal-hint assign-modal-no-questions">
              No questions added yet. Questions are optional — use them to break the assignment into gradable parts.
            </p>
          )}

          {questions.map(function (q, index) {
            return (
              <div className="assign-modal-question-row" key={index}>
                <textarea
                  rows="2"
                  placeholder={"Question " + (index + 1) + " text"}
                  value={q.questionText}
                  onChange={(e) => updateQuestion(index, "questionText", e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Marks"
                  value={q.marks}
                  onChange={(e) => updateQuestion(index, "marks", e.target.value)}
                />
                <button type="button" className="assign-modal-remove-question" onClick={() => removeQuestion(index)}>
                  Remove
                </button>
              </div>
            );
          })}

          <div className="assign-modal-questions-header">
            <h3>Attached Files / Links</h3>
          </div>

          {attachments.map(function (att, index) {
            return (
              <div className="assign-modal-attachment-row" key={index}>
                <input
                  type="text"
                  placeholder="File name (e.g. Assignment1.pdf)"
                  value={att.fileName}
                  onChange={(e) => updateAttachment(index, "fileName", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="File URL / link"
                  value={att.fileUrl}
                  onChange={(e) => updateAttachment(index, "fileUrl", e.target.value)}
                />
                <button type="button" className="assign-modal-remove-attachment" onClick={() => removeAttachment(index)}>
                  Remove
                </button>
              </div>
            );
          })}

          <button type="button" className="assign-modal-add-attachment" onClick={addAttachment}>
            + Add Attachment
          </button>

          <div className="assign-modal-actions">
            <button type="button" className="assign-modal-btn assign-modal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="assign-modal-btn assign-modal-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssignmentFormModal;
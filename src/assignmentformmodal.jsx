import { useState, useEffect, useRef } from "react";
import { resolveFileUrl } from "./config";
import "./assignmentformmodal.css";

function blankTopic() {  return { topicText: "", description: "" };
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
  var [topics, setTopics] = useState(
    isEdit && assignment.topics && assignment.topics.length > 0
      ? assignment.topics.map(function (t) {
          return { topicText: t.topicText || "", description: t.description || "" };
        })
      : [],
  );
  var [referenceLinks, setReferenceLinks] = useState(
    isEdit && assignment.referenceLinks && assignment.referenceLinks.length > 0
      ? assignment.referenceLinks.slice()
      : [],
  );
var [errorMessage, setErrorMessage] = useState("");
  var [isSubmitting, setIsSubmitting] = useState(false);
  var [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  var [attachmentUploadError, setAttachmentUploadError] = useState("");
  var attachmentInputRef = useRef(null);

  function getToken() {    return localStorage.getItem("token");
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

function handleChooseAttachmentClick() {
    setAttachmentUploadError("");
    if (attachmentInputRef.current) {
      attachmentInputRef.current.click();
    }
  }

  function handleAttachmentFileSelected(e) {
    var pickedFile = e.target.files && e.target.files[0];
    if (!pickedFile) return;
    setAttachmentUploadError("");
    setIsUploadingAttachment(true);

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
          setAttachments(function (prev) {
            return prev.concat([{ fileName: data.fileName, fileUrl: data.fileUrl }]);
          });
        } else {
          setAttachmentUploadError(data.message || "Failed to upload file.");
        }
      })
      .catch(function (error) {
        console.error("Error uploading attachment:", error);
        setAttachmentUploadError("Server or network error while uploading. Please try again.");
      })
      .finally(function () {
        setIsUploadingAttachment(false);
        if (attachmentInputRef.current) {
          attachmentInputRef.current.value = "";
        }
      });
  }

  function removeAttachment(index) {    setAttachments(function (prev) {
      return prev.filter(function (_, i) {
        return i !== index;
      });
    });
  }

  function updateTopic(index, field, value) {
    setTopics(function (prev) {
      var next = prev.slice();
      next[index] = Object.assign({}, next[index]);
      next[index][field] = value;
      return next;
    });
  }

  function addTopic() {
    setTopics(function (prev) {
      return prev.concat([blankTopic()]);
    });
  }

  function removeTopic(index) {
    setTopics(function (prev) {
      return prev.filter(function (_, i) {
        return i !== index;
      });
    });
  }

  function updateReferenceLink(index, value) {
    setReferenceLinks(function (prev) {
      var next = prev.slice();
      next[index] = value;
      return next;
    });
  }

  function addReferenceLink() {
    setReferenceLinks(function (prev) {
      return prev.concat([""]);
    });
  }

  function removeReferenceLink(index) {
    setReferenceLinks(function (prev) {
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

    var cleanedTopics = topics.filter(function (t) {
      return t.topicText.trim() !== "";
    });

    var cleanedReferenceLinks = referenceLinks
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l !== ""; });

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
      referenceLinks: cleanedReferenceLinks,
      topics: cleanedTopics.map(function (t) {
        return { topicText: t.topicText.trim(), description: t.description ? t.description.trim() : "" };
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
            <h3>Research Topics</h3>
            <button type="button" className="assign-modal-add-question-btn" onClick={addTopic}>
              + Add Topic
            </button>
          </div>

          {topics.length === 0 && (
            <p className="assign-modal-hint assign-modal-no-questions">
              No topics added yet. Add one or more research topics for students to work on and submit findings for.
            </p>
          )}

          {topics.map(function (t, index) {
            return (
              <div className="assign-modal-question-row" key={index}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder={"Topic " + (index + 1) + " title"}
                    value={t.topicText}
                    onChange={(e) => updateTopic(index, "topicText", e.target.value)}
                  />
                  <textarea
                    rows="2"
                    placeholder="Topic details / guidance (optional)"
                    value={t.description}
                    onChange={(e) => updateTopic(index, "description", e.target.value)}
                  />
                </div>
                <button type="button" className="assign-modal-remove-question" onClick={() => removeTopic(index)}>
                  Remove
                </button>
              </div>
            );
          })}

          <div className="assign-modal-questions-header">
            <h3>Reference Materials (Files &amp; Links)</h3>
          </div>
          <span className="assign-modal-hint">
            Upload/attach reference documents students can use for their research
          </span>

<input
            type="file"
            ref={attachmentInputRef}
            style={{ display: "none" }}
            onChange={handleAttachmentFileSelected}
          />

          {attachments.map(function (att, index) {
            return (
              <div className="assign-modal-attachment-row" key={index}>
                <span className="assign-modal-uploaded-filename">📎 {att.fileName}</span>
                <a
                  className="assign-modal-view-link"
                  href={resolveFileUrl(att.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View
                </a>
                <button type="button" className="assign-modal-remove-attachment" onClick={() => removeAttachment(index)}>
                  Remove
                </button>
              </div>
            );
          })}

          <button
            type="button"
            className="assign-modal-add-attachment"
            onClick={handleChooseAttachmentClick}
            disabled={isUploadingAttachment}
          >
            {isUploadingAttachment ? "Uploading..." : "+ Upload File"}
          </button>
          {attachmentUploadError !== "" && <div className="assign-modal-error">{attachmentUploadError}</div>}
          <div className="assign-modal-questions-header">
            <h3>Suggested Reference Links</h3>
          </div>
          <span className="assign-modal-hint">
            Plain links (articles, papers, sites) students should refer to for this topic
          </span>

          {referenceLinks.map(function (link, index) {
            return (
              <div className="assign-modal-attachment-row" key={index}>
                <input
                  type="text"
                  placeholder="https://example.com/article"
                  value={link}
                  onChange={(e) => updateReferenceLink(index, e.target.value)}
                />
                {link && link.trim() !== "" && (
                  <a className="assign-modal-view-link" href={link} target="_blank" rel="noreferrer">
                    View
                  </a>
                )}
                <button
                  type="button"
                  className="assign-modal-remove-attachment"
                  onClick={() => removeReferenceLink(index)}
                >
                  Remove
                </button>
              </div>
            );
          })}

          <button type="button" className="assign-modal-add-attachment" onClick={addReferenceLink}>
            + Add Reference Link
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
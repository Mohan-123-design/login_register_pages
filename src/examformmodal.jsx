import { useState, useEffect } from "react";
import "./examformmodal.css";

function blankQuestion() {
  return {
    questionText: "",
    options: ["", "", "", ""],
    correctOption: 0,
    marks: 1,
  };
}

function ExamFormModal({ mode, exam, onClose, onSaved }) {
  var isEdit = mode === "edit";
  var [title, setTitle] = useState(isEdit ? exam.title : "");
  var [examDate, setExamDate] = useState(
    isEdit && exam.examDate ? new Date(exam.examDate).toISOString().slice(0, 16) : "",
  );
  var [duration, setDuration] = useState(isEdit ? exam.duration : "");
  var [totalMarks, setTotalMarks] = useState(isEdit ? exam.totalMarks : "");
  var [passingMarks, setPassingMarks] = useState(isEdit ? exam.passingMarks : "");
  var [instructions, setInstructions] = useState(isEdit ? exam.instructions || "" : "");
  var [courseId, setCourseId] = useState(isEdit && exam.courseId ? exam.courseId : "");
  var [batchId, setBatchId] = useState(isEdit && exam.batchId ? exam.batchId : "");
  var [courses, setCourses] = useState([]);
  var [batches, setBatches] = useState([]);
  var [questions, setQuestions] = useState(
    isEdit && exam.questions && exam.questions.length > 0
      ? exam.questions.map(function (q) {
          return {
            questionText: q.questionText,
            options: q.options && q.options.length > 0 ? q.options : ["", "", "", ""],
            correctOption: q.correctOption || 0,
            marks: q.marks || 1,
          };
        })
      : [blankQuestion()],
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

  function updateQuestion(index, field, value) {
    setQuestions(function (prev) {
      var next = prev.slice();
      next[index] = Object.assign({}, next[index]);
      next[index][field] = value;
      return next;
    });
  }

  function updateOption(qIndex, oIndex, value) {
    setQuestions(function (prev) {
      var next = prev.slice();
      var q = Object.assign({}, next[qIndex]);
      var opts = q.options.slice();
      opts[oIndex] = value;
      q.options = opts;
      next[qIndex] = q;
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

  function computedTotalFromQuestions() {
    return questions.reduce(function (sum, q) {
      return sum + (parseInt(q.marks, 10) || 0);
    }, 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");

    if (title.trim() === "") {
      setErrorMessage("Exam name is required");
      return;
    }
    if (examDate === "") {
      setErrorMessage("Exam date & time is required");
      return;
    }
    if (!duration || Number(duration) <= 0) {
      setErrorMessage("Duration must be a positive number of minutes");
      return;
    }
    if (!totalMarks || Number(totalMarks) <= 0) {
      setErrorMessage("Total marks must be a positive number");
      return;
    }
    if (passingMarks === "" || Number(passingMarks) < 0) {
      setErrorMessage("Passing marks are required");
      return;
    }
    if (Number(passingMarks) > Number(totalMarks)) {
      setErrorMessage("Passing marks cannot exceed total marks");
      return;
    }
    for (var i = 0; i < questions.length; i++) {
      if (questions[i].questionText.trim() === "") {
        setErrorMessage("Question " + (i + 1) + " text cannot be empty");
        return;
      }
      var filledOptions = questions[i].options.filter(function (o) {
        return o.trim() !== "";
      });
      if (filledOptions.length < 2) {
        setErrorMessage("Question " + (i + 1) + " needs at least 2 options");
        return;
      }
    }

    var payload = {
      title: title.trim(),
      examDate: examDate,
      duration: Number(duration),
      totalMarks: Number(totalMarks),
      passingMarks: Number(passingMarks),
      instructions: instructions,
      courseId: courseId || null,
      batchId: batchId || null,
      questions: questions,
    };

    setIsSubmitting(true);
    try {
      var url = isEdit ? "/api/exams/" + exam._id : "/api/exams";
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
        onSaved(isEdit ? "Exam updated successfully" : "Exam created successfully");
      } else {
        setErrorMessage(data.message || "Failed to save exam");
      }
    } catch (error) {
      console.error("Error saving exam:", error);
      setErrorMessage("Server or network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="exam-modal-overlay" onClick={onClose}>
      <div className="exam-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="exam-modal-header">
          <h2>{isEdit ? "Edit Exam" : "Create Exam"}</h2>
          <button className="exam-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="exam-modal-form">
          {errorMessage !== "" && <div className="exam-modal-error">{errorMessage}</div>}

          <div className="exam-modal-row">
            <div className="exam-modal-field">
              <label>Exam Name *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="exam-modal-field">
              <label>Exam Date &amp; Time *</label>
              <input type="datetime-local" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
          </div>

          <div className="exam-modal-row">
            <div className="exam-modal-field">
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
            <div className="exam-modal-field">
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

          <div className="exam-modal-row">
            <div className="exam-modal-field">
              <label>Duration (minutes) *</label>
              <input type="number" min="1" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div className="exam-modal-field">
              <label>Total Marks *</label>
              <input type="number" min="1" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} />
            </div>
            <div className="exam-modal-field">
              <label>Passing Marks *</label>
              <input type="number" min="0" value={passingMarks} onChange={(e) => setPassingMarks(e.target.value)} />
            </div>
          </div>

          <div className="exam-modal-field">
            <label>Instructions</label>
            <textarea
              rows="3"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Instructions shown to students before starting the exam"
            />
          </div>

          <div className="exam-modal-questions-header">
            <h3>Questions</h3>
            <span className="exam-modal-hint">
              Question marks total: {computedTotalFromQuestions()}
              {totalMarks !== "" ? " / " + totalMarks : ""}
            </span>
          </div>

          {questions.map(function (q, qIndex) {
            return (
              <div className="exam-modal-question-card" key={qIndex}>
                <div className="exam-modal-question-card-header">
                  <span>Question {qIndex + 1}</span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      className="exam-modal-remove-question"
                      onClick={() => removeQuestion(qIndex)}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="exam-modal-field">
                  <label>Question Text</label>
                  <input
                    type="text"
                    value={q.questionText}
                    onChange={(e) => updateQuestion(qIndex, "questionText", e.target.value)}
                  />
                </div>
                <div className="exam-modal-options-grid">
                  {q.options.map(function (opt, oIndex) {
                    return (
                      <div className="exam-modal-option-row" key={oIndex}>
                        <input
                          type="radio"
                          name={"correct-" + qIndex}
                          checked={q.correctOption === oIndex}
                          onChange={() => updateQuestion(qIndex, "correctOption", oIndex)}
                          title="Mark as correct answer"
                        />
                        <input
                          type="text"
                          placeholder={"Option " + (oIndex + 1)}
                          value={opt}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="exam-modal-field exam-modal-marks-field">
                  <label>Marks for this question</label>
                  <input
                    type="number"
                    min="1"
                    value={q.marks}
                    onChange={(e) => updateQuestion(qIndex, "marks", parseInt(e.target.value, 10) || 1)}
                  />
                </div>
              </div>
            );
          })}

          <button type="button" className="exam-modal-add-question" onClick={addQuestion}>
            + Add Question
          </button>

          <div className="exam-modal-actions">
            <button type="button" className="exam-modal-btn exam-modal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="exam-modal-btn exam-modal-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExamFormModal;
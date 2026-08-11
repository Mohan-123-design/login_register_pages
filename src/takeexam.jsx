import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./takeexam.css";

function TakeExam() {
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

  var params = useParams();
  var navigate = useNavigate();
  var examId = params.id;

  var [exam, setExam] = useState(null);
  var [answers, setAnswers] = useState({});
  var [isLoading, setIsLoading] = useState(true);
  var [errorMessage, setErrorMessage] = useState("");
  var [alreadyDone, setAlreadyDone] = useState(false);
  var [isSubmitting, setIsSubmitting] = useState(false);
  var [submittedResult, setSubmittedResult] = useState(null);
  var [secondsLeft, setSecondsLeft] = useState(null);

  var answersRef = useRef(answers);
  answersRef.current = answers;
  var hasSubmittedRef = useRef(false);

  function getToken() {
    return localStorage.getItem("token");
  }

  useEffect(function () {
    setIsLoading(true);
    setErrorMessage("");
    fetch("/api/exams/" + examId, {
      headers: { Authorization: "Bearer " + getToken() },
    })
      .then(function (response) {
        if (response.status === 401) {
          navigate("/access-denied");
          return null;
        }
        return response.json().then(function (data) {
          return { status: response.status, data: data };
        });
      })
      .then(function (payload) {
        if (payload === null) return;
        var data = payload.data;
        if (!data.success) {
          setErrorMessage(data.message || "This exam could not be loaded.");
          return;
        }
        if (data.exam.effectiveStatus !== "Ongoing") {
          setErrorMessage(
            data.exam.effectiveStatus === "Published"
              ? "This exam has not started yet. Come back at the scheduled time."
              : data.exam.effectiveStatus === "Completed"
                ? "This exam window has already closed."
                : "This exam is not currently open."
          );
          setExam(data.exam);
          return;
        }
        if (data.exam.myCompletionStatus === "Completed") {
          setAlreadyDone(true);
          setExam(data.exam);
          return;
        }
        setExam(data.exam);
        var end = new Date(data.exam.examDate).getTime() + (data.exam.duration || 0) * 60000;
        var remaining = Math.max(Math.floor((end - Date.now()) / 1000), 0);
        setSecondsLeft(remaining);
      })
      .catch(function (error) {
        console.error("Error fetching exam:", error);
        setErrorMessage("Server or network error. Is the backend running?");
      })
      .finally(function () {
        setIsLoading(false);
      });
  }, []);

  useEffect(function () {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      if (!hasSubmittedRef.current) {
        submitExam(true);
      }
      return;
    }
    var timer = setTimeout(function () {
      setSecondsLeft(function (s) {
        return s - 1;
      });
    }, 1000);
    return function () {
      clearTimeout(timer);
    };
  }, [secondsLeft]);

  function selectAnswer(questionIndex, optionIndex) {
    setAnswers(function (prev) {
      var next = Object.assign({}, prev);
      next[questionIndex] = optionIndex;
      return next;
    });
  }

  function formatTime(totalSeconds) {
    var m = Math.floor(totalSeconds / 60);
    var s = totalSeconds % 60;
    return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
  }

  async function submitExam(isAutoSubmit) {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setIsSubmitting(true);

    var currentAnswers = answersRef.current;
    var payload = exam.questions.map(function (_, idx) {
      return {
        questionIndex: idx,
        selectedOption: currentAnswers[idx] !== undefined ? currentAnswers[idx] : -1,
      };
    });

    try {
      var response = await fetch("/api/exams/" + examId + "/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getToken(),
        },
        body: JSON.stringify({ answers: payload }),
      });
      var data = await response.json();
      if (data.success) {
        setSubmittedResult(data.result);
      } else {
        hasSubmittedRef.current = false;
        alert(data.message || "Failed to submit exam.");
      }
    } catch (error) {
      hasSubmittedRef.current = false;
      console.error("Error submitting exam:", error);
      alert("Failed to submit exam. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmSubmit() {
    var unanswered = exam.questions.filter(function (_, idx) {
      return answers[idx] === undefined;
    }).length;
    var proceed =
      unanswered === 0 || window.confirm(unanswered + " question(s) are unanswered. Submit anyway?");
    if (proceed) submitExam(false);
  }

  if (isLoading) {
    return <div className="take-exam-page"><div className="take-exam-status-msg take-exam-loading">Loading exam...</div></div>;
  }

  if (submittedResult !== null) {
    return (
      <div className="take-exam-page">
        <div className="take-exam-result-card">
          <h2>Exam Submitted</h2>
          <p className="take-exam-result-sub">Your answers have been recorded and graded automatically.</p>
          <div className="take-exam-result-grid">
            <div><span>Score</span><strong>{submittedResult.obtainedMarks} / {submittedResult.totalMarks}</strong></div>
            <div><span>Percentage</span><strong>{submittedResult.percentage}%</strong></div>
            <div><span>Grade</span><strong>{submittedResult.grade}</strong></div>
            <div><span>Result</span><strong className={submittedResult.passStatus === "Pass" ? "take-exam-pass" : "take-exam-fail"}>{submittedResult.passStatus}</strong></div>
          </div>
          <button className="take-exam-btn take-exam-btn-primary" onClick={() => navigate("/my-exams")}>
            Back to My Exams
          </button>
        </div>
      </div>
    );
  }

  if (alreadyDone) {
    return (
      <div className="take-exam-page">
        <div className="take-exam-status-msg take-exam-info">
          You have already submitted this exam. Check My Exams for your result.
        </div>
        <button className="take-exam-btn take-exam-btn-secondary" onClick={() => navigate("/my-exams")}>
          Back to My Exams
        </button>
      </div>
    );
  }

  if (errorMessage !== "") {
    return (
      <div className="take-exam-page">
        <div className="take-exam-status-msg take-exam-error">{errorMessage}</div>
        <button className="take-exam-btn take-exam-btn-secondary" onClick={() => navigate("/my-exams")}>
          Back to My Exams
        </button>
      </div>
    );
  }

  return (
    <div className="take-exam-page">
      <div className="take-exam-header">
        <div>
          <h1>{exam.title}</h1>
          <p className="take-exam-subtitle">
            {exam.courseName || "General"} • {exam.totalMarks} marks • Passing: {exam.passingMarks}
          </p>
        </div>
        <div className={"take-exam-timer" + (secondsLeft !== null && secondsLeft <= 60 ? " take-exam-timer-warn" : "")}>
          Time Left: {secondsLeft !== null ? formatTime(secondsLeft) : "--:--"}
        </div>
      </div>

      {exam.instructions ? <div className="take-exam-instructions">{exam.instructions}</div> : null}

      <div className="take-exam-questions">
        {exam.questions.map(function (q, idx) {
          return (
            <div className="take-exam-question-card" key={idx}>
              <p className="take-exam-question-text">
                {idx + 1}. {q.questionText}{" "}
                <span className="take-exam-question-marks">({q.marks} {q.marks === 1 ? "mark" : "marks"})</span>
              </p>
              <div className="take-exam-options">
                {q.options.map(function (opt, optIdx) {
                  return (
                    <label className="take-exam-option" key={optIdx}>
                      <input
                        type="radio"
                        name={"question-" + idx}
                        checked={answers[idx] === optIdx}
                        onChange={() => selectAnswer(idx, optIdx)}
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="take-exam-footer">
        <span className="take-exam-progress">
          {Object.keys(answers).length} / {exam.questions.length} answered
        </span>
        <button className="take-exam-btn take-exam-btn-primary" disabled={isSubmitting} onClick={confirmSubmit}>
          {isSubmitting ? "Submitting..." : "Submit Exam"}
        </button>
      </div>
    </div>
  );
}

export default TakeExam;
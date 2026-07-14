import { useState } from "react";
import "./AttendanceManagement.css";
function AttendanceManagement() {
  var [studentsList, setStudentsList] = useState([]);
  var [isStudentsLoaded, setIsStudentsLoaded] = useState(false);
  var [sessionId, setSessionId] = useState("");
  var [attendanceDate, setAttendanceDate] = useState("");
  var [statusMap, setStatusMap] = useState({});
  var [joinTimeMap, setJoinTimeMap] = useState({});
  var [leaveTimeMap, setLeaveTimeMap] = useState({});
  var [successMessage, setSuccessMessage] = useState("");
  var [errorMessage, setErrorMessage] = useState("");
  var [savedRecords, setSavedRecords] = useState([]);
  var [isSubmitting, setIsSubmitting] = useState(false);
  var loggedInUser = localStorage.getItem("loggedInUser");
  if (loggedInUser === null) {
    window.location.href = "/access-denied";
    return null;
  }
  var userData = JSON.parse(loggedInUser);
  if (userData.role !== "Teacher" && userData.role !== "Admin") {
    window.location.href = "/access-denied";
    return null;
  }
  function getToken() {
    return localStorage.getItem("token");
  }
  function getCurrentDateTime() {
    var now = new Date();
    var year = now.getFullYear();
    var month = String(now.getMonth() + 1);
    if (month.length === 1) {
      month = "0" + month;
    }
    var day = String(now.getDate());
    if (day.length === 1) {
      day = "0" + day;
    }
    var hours = String(now.getHours());
    if (hours.length === 1) {
      hours = "0" + hours;
    }
    var minutes = String(now.getMinutes());
    if (minutes.length === 1) {
      minutes = "0" + minutes;
    }
    return year + "-" + month + "-" + day + "T" + hours + ":" + minutes;
  }
  function loadStudents() {
    fetch("/api/students", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
      },
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          setStudentsList(data.students);
          var defaultStatus = {};
          var defaultJoinTime = {};
          var defaultLeaveTime = {};
          var currentTime = getCurrentDateTime();

          for (var i = 0; i < data.students.length; i++) {
            defaultStatus[data.students[i].email] = "Present";
            defaultJoinTime[data.students[i].email] = currentTime;
            defaultLeaveTime[data.students[i].email] = "";
          }
          setStatusMap(defaultStatus);
          setJoinTimeMap(defaultJoinTime);
          setLeaveTimeMap(defaultLeaveTime);
          setIsStudentsLoaded(true);
        }
      })
      .catch(function (error) {
        console.error(error);
        setErrorMessage("Could not load students. Is the server running?");
      });
  }
  function loadAttendanceRecords() {
    var url = "/api/attendance";
    if (attendanceDate !== "") {
      url = url + "?date=" + attendanceDate;
    }
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
      },
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          setSavedRecords(data.records);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  function handleLoadStudents() {
    setSuccessMessage("");
    setErrorMessage("");
    if (attendanceDate === "") {
      setErrorMessage("Please select a date first.");
      return;
    }
    if (sessionId === "") {
      setErrorMessage("Please enter a Session ID first.");
      return;
    }
    loadStudents();
    loadAttendanceRecords();
  }
  function handleStatusChange(email, newStatus) {
    var updatedMap = {};
    var keys = Object.keys(statusMap);
    for (var i = 0; i < keys.length; i++) {
      updatedMap[keys[i]] = statusMap[keys[i]];
    }
    updatedMap[email] = newStatus;
    setStatusMap(updatedMap);
  }
  function handleJoinTimeChange(email, newTime) {
    var updatedMap = {};
    var keys = Object.keys(joinTimeMap);
    for (var i = 0; i < keys.length; i++) {
      updatedMap[keys[i]] = joinTimeMap[keys[i]];
    }
    updatedMap[email] = newTime;
    setJoinTimeMap(updatedMap);
  }
  function handleLeaveTimeChange(email, newTime) {
    var updatedMap = {};
    var keys = Object.keys(leaveTimeMap);
    for (var i = 0; i < keys.length; i++) {
      updatedMap[keys[i]] = leaveTimeMap[keys[i]];
    }
    updatedMap[email] = newTime;
    setLeaveTimeMap(updatedMap);
  }
  function handleSubmitAttendance() {
    setSuccessMessage("");
    setErrorMessage("");
    if (attendanceDate === "") {
      setErrorMessage("Please select a date first.");
      return;
    }
    if (sessionId === "") {
      setErrorMessage("Please enter a Session ID first.");
      return;
    }
    if (studentsList.length === 0) {
      setErrorMessage('No students loaded. Click "Load Students" first.');
      return;
    }
    setIsSubmitting(true);
    var totalToSend = studentsList.length;
    var successCount = 0;
    var skipCount = 0;
    var failCount = 0;
    var errorMessages = [];
    for (var i = 0; i < studentsList.length; i++) {
      var student = studentsList[i];
      var requestBody = {
        userId: student.email,
        sessionId: sessionId,
        joinTime: joinTimeMap[student.email] || getCurrentDateTime(),
        status: statusMap[student.email] || "Present",
        studentName: student.firstName + " " + student.lastName,
        studentEmail: student.email,
        date: attendanceDate,
      };
      if (leaveTimeMap[student.email] && leaveTimeMap[student.email] !== "") {
        requestBody.leaveTime = leaveTimeMap[student.email];
      }
      (function (body, studentEmail) {
        fetch("/api/attendance/mark", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + getToken(),
          },
          body: JSON.stringify(body),
        })
          .then(function (response) {
            return response.json();
          })
          .then(function (data) {
            if (data.success) {
              successCount = successCount + 1;
            } else {
              skipCount = skipCount + 1;
              errorMessages.push(studentEmail + ": " + data.message);
            }
            if (successCount + skipCount + failCount === totalToSend) {
              setIsSubmitting(false);
              finishSubmission(
                successCount,
                skipCount,
                failCount,
                errorMessages,
              );
            }
          })
          .catch(function (error) {
            console.error(error);
            failCount = failCount + 1;
            errorMessages.push(studentEmail + ": Request failed");
            if (successCount + skipCount + failCount === totalToSend) {
              setIsSubmitting(false);
              finishSubmission(
                successCount,
                skipCount,
                failCount,
                errorMessages,
              );
            }
          });
      })(requestBody, student.email);
    }
  }
  function finishSubmission(successCount, skipCount, failCount, errorMessages) {
    var message = "Attendance marked for " + successCount + " student(s).";
    if (skipCount > 0) {
      message = message + " " + skipCount + " already marked (skipped).";
    }
    if (failCount > 0) {
      message = message + " " + failCount + " failed.";
    }
    if (failCount > 0 || skipCount > 0) {
      setErrorMessage(message + " Details: " + errorMessages.join("; "));
    }
    if (successCount > 0) {
      setSuccessMessage(message);
    }
    loadAttendanceRecords();
  }
  var studentRows = [];
  for (var i = 0; i < studentsList.length; i++) {
    var student = studentsList[i];
    var row = (function (stu, index) {
      return (
        <tr key={stu.email} className="attendance-student-row">
          <td className="attendance-td">{index + 1}</td>
          <td className="attendance-td">
            {stu.firstName + " " + stu.lastName}
          </td>
          <td className="attendance-td">{stu.email}</td>
          <td className="attendance-td">
            <input
              type="datetime-local"
              className="attendance-time-input"
              value={joinTimeMap[stu.email] || ""}
              onChange={function (e) {
                handleJoinTimeChange(stu.email, e.target.value);
              }}
            />
          </td>
          <td className="attendance-td">
            <input
              type="datetime-local"
              className="attendance-time-input"
              value={leaveTimeMap[stu.email] || ""}
              onChange={function (e) {
                handleLeaveTimeChange(stu.email, e.target.value);
              }}
            />
          </td>
          <td className="attendance-td">
            <select
              className="attendance-status-select"
              value={statusMap[stu.email] || "Present"}
              onChange={function (e) {
                handleStatusChange(stu.email, e.target.value);
              }}
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
            </select>
          </td>
        </tr>
      );
    })(student, i);
    studentRows.push(row);
  }
  var savedRows = [];
  for (var j = 0; j < savedRecords.length; j++) {
    var record = savedRecords[j];
    var badgeClass = "status-unknown";
    if (record.status === "Present") {
      badgeClass = "status-present";
    } else if (record.status === "Absent") {
      badgeClass = "status-absent";
    } else if (record.status === "Late") {
      badgeClass = "status-late";
    }
    savedRows.push(
      <tr key={j} className="attendance-record-row">
        <td className="attendance-td">{j + 1}</td>
        <td className="attendance-td">
          {record.studentName || record.userId || "—"}
        </td>
        <td className="attendance-td">{record.studentEmail || "—"}</td>
        <td className="attendance-td">{record.sessionId || "—"}</td>
        <td className="attendance-td">{record.date || "—"}</td>
        <td className="attendance-td">
          <span className={badgeClass}>{record.status}</span>
        </td>
        <td className="attendance-td">{record.markedBy || "—"}</td>
      </tr>,
    );
  }

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <h1 className="attendance-page-title">Attendance Management</h1>
        <a href="/dashboard" className="attendance-back-btn">
          ← Back to Dashboard
        </a>
      </div>
      <div className="attendance-content">
        <div className="attendance-date-section">
          <div className="attendance-date-group">
            <label
              htmlFor="attendance-session-input"
              className="attendance-label"
            >
              Session ID:
            </label>
            <input
              type="text"
              id="attendance-session-input"
              className="attendance-date-input"
              placeholder="e.g. ROOM-AI-12345"
              value={sessionId}
              onChange={function (e) {
                setSessionId(e.target.value);
              }}
            />
          </div>
          <div className="attendance-date-group">
            <label htmlFor="attendance-date-input" className="attendance-label">
              Select Date:
            </label>
            <input
              type="date"
              id="attendance-date-input"
              className="attendance-date-input"
              value={attendanceDate}
              onChange={function (e) {
                setAttendanceDate(e.target.value);
              }}
            />
          </div>
          <button
            className="attendance-load-btn"
            onClick={handleLoadStudents}
            disabled={isSubmitting}
          >
            Load Students
          </button>
        </div>
        {successMessage !== "" && (
          <div className="attendance-success-box">{successMessage}</div>
        )}
        {errorMessage !== "" && (
          <div className="attendance-error-box">{errorMessage}</div>
        )}
        {isStudentsLoaded === true && studentsList.length > 0 && (
          <div className="attendance-form-section">
            <h2 className="attendance-section-title">
              Mark Attendance for {attendanceDate} — Session: {sessionId}
            </h2>
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th className="attendance-th">#</th>
                    <th className="attendance-th">Name</th>
                    <th className="attendance-th">Email</th>
                    <th className="attendance-th">Join Time</th>
                    <th className="attendance-th">Leave Time</th>
                    <th className="attendance-th">Status</th>
                  </tr>
                </thead>
                <tbody>{studentRows}</tbody>
              </table>
            </div>
            <button
              className="attendance-submit-btn"
              onClick={handleSubmitAttendance}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Attendance"}
            </button>
          </div>
        )}
        {isStudentsLoaded === true && studentsList.length === 0 && (
          <div className="attendance-empty-box">
            <div className="attendance-empty-icon">👥</div>
            <p>No students or employees found in the system.</p>
            <p>Register some users with the Student or Employee role first.</p>
          </div>
        )}
        {savedRecords.length > 0 && (
          <div className="attendance-records-section">
            <h2 className="attendance-section-title">Attendance Records</h2>
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th className="attendance-th">#</th>
                    <th className="attendance-th">Name</th>
                    <th className="attendance-th">Email</th>
                    <th className="attendance-th">Session</th>
                    <th className="attendance-th">Date</th>
                    <th className="attendance-th">Status</th>
                    <th className="attendance-th">Marked By</th>
                  </tr>
                </thead>
                <tbody>{savedRows}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendanceManagement;

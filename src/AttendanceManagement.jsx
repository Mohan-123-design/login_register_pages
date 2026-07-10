import { useState } from "react";
import "./AttendanceManagement.css";
function AttendanceManagement() {
  var [studentsList, setStudentsList] = useState([]);
  var [attendanceDate, setAttendanceDate] = useState("");
  var [statusMap, setStatusMap] = useState({});
  var [successMessage, setSuccessMessage] = useState("");
  var [errorMessage, setErrorMessage] = useState("");
  var [isLoaded, setIsLoaded] = useState(false);
  var [savedRecords, setSavedRecords] = useState([]);
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
          for (var i = 0; i < data.students.length; i++) {
            defaultStatus[data.students[i].email] = "Present";
          }
          setStatusMap(defaultStatus);
          setIsLoaded(true);
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
  function handleSubmitAttendance() {
    setSuccessMessage("");
    setErrorMessage("");

    if (attendanceDate === "") {
      setErrorMessage("Please select a date first.");
      return;
    }

    if (studentsList.length === 0) {
      setErrorMessage('No students loaded. Click "Load Students" first.');
      return;
    }
    var records = [];
    for (var i = 0; i < studentsList.length; i++) {
      var student = studentsList[i];
      records.push({
        studentEmail: student.email,
        studentName: student.firstName + " " + student.lastName,
        status: statusMap[student.email],
      });
    }

    fetch("/api/mark-attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
      },
      body: JSON.stringify({
        date: attendanceDate,
        records: records,
      }),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          setSuccessMessage(data.message);
          loadAttendanceRecords();
        } else {
          setErrorMessage(data.message);
        }
      })
      .catch(function (error) {
        console.error(error);
        setErrorMessage("Error saving attendance. Is the server running?");
      });
  }
  var studentRows = [];
  for (var i = 0; i < studentsList.length; i++) {
    var student = studentsList[i];
    var row = (function (stu) {
      return (
        <tr key={stu.email} className="attendance-student-row">
          <td className="attendance-td">{i + 1}</td>
          <td className="attendance-td">
            {stu.firstName + " " + stu.lastName}
          </td>
          <td className="attendance-td">{stu.email}</td>
          <td className="attendance-td">{stu.role}</td>
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
            </select>
          </td>
        </tr>
      );
    })(student);
    studentRows.push(row);
  }
  var savedRows = [];
  for (var j = 0; j < savedRecords.length; j++) {
    var record = savedRecords[j];
    savedRows.push(
      <tr key={j} className="attendance-record-row">
        <td className="attendance-td">{j + 1}</td>
        <td className="attendance-td">{record.studentName}</td>
        <td className="attendance-td">{record.studentEmail}</td>
        <td className="attendance-td">{record.date}</td>
        <td className="attendance-td">
          <span
            className={
              record.status === "Present" ? "status-present" : "status-absent"
            }
          >
            {record.status}
          </span>
        </td>
        <td className="attendance-td">{record.markedBy}</td>
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
          <button className="attendance-load-btn" onClick={handleLoadStudents}>
            Load Students
          </button>
        </div>

        {successMessage !== "" && (
          <div className="attendance-success-box">{successMessage}</div>
        )}
        {errorMessage !== "" && (
          <div className="attendance-error-box">{errorMessage}</div>
        )}

        {isLoaded === true && studentsList.length > 0 && (
          <div className="attendance-form-section">
            <h2 className="attendance-section-title">
              Mark Attendance for {attendanceDate}
            </h2>
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th className="attendance-th">#</th>
                    <th className="attendance-th">Name</th>
                    <th className="attendance-th">Email</th>
                    <th className="attendance-th">Role</th>
                    <th className="attendance-th">Status</th>
                  </tr>
                </thead>
                <tbody>{studentRows}</tbody>
              </table>
            </div>
            <button
              className="attendance-submit-btn"
              onClick={handleSubmitAttendance}
            >
              Submit Attendance
            </button>
          </div>
        )}

        {isLoaded === true && studentsList.length === 0 && (
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

import { useState } from "react";
import "./MyAttendance.css";

function MyAttendance() {
  var [attendanceRecords, setAttendanceRecords] = useState([]);
  var [isLoaded, setIsLoaded] = useState(false);
  var [dateFilter, setDateFilter] = useState("");
  var loggedInUser = localStorage.getItem("loggedInUser");
  if (loggedInUser === null) {
    window.location.href = "/access-denied";
    return null;
  }
  var userData = JSON.parse(loggedInUser);
  if (
    userData.role !== "Student" &&
    userData.role !== "Employee" &&
    userData.role !== "Teacher" &&
    userData.role !== "Admin"
  ) {
    window.location.href = "/access-denied";
    return null;
  }

  function getToken() {
    return localStorage.getItem("token");
  }

  function loadMyAttendance() {
    var url = "/api/attendance";
    if (dateFilter !== "") {
      url = url + "?date=" + dateFilter;
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
          setAttendanceRecords(data.records);
          setIsLoaded(true);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  var presentCount = 0;
  var absentCount = 0;
  for (var k = 0; k < attendanceRecords.length; k++) {
    if (attendanceRecords[k].status === "Present") {
      presentCount = presentCount + 1;
    } else {
      absentCount = absentCount + 1;
    }
  }

  var recordRows = [];
  for (var i = 0; i < attendanceRecords.length; i++) {
    var record = attendanceRecords[i];
    recordRows.push(
      <tr key={i} className="my-attendance-row">
        <td className="my-attendance-td">{i + 1}</td>
        <td className="my-attendance-td">{record.studentName}</td>
        <td className="my-attendance-td">{record.date}</td>
        <td className="my-attendance-td">
          <span
            className={
              record.status === "Present"
                ? "my-status-present"
                : "my-status-absent"
            }
          >
            {record.status}
          </span>
        </td>
        <td className="my-attendance-td">{record.markedBy}</td>
      </tr>,
    );
  }

  return (
    <div className="my-attendance-page">
      <div className="my-attendance-header">
        <h1 className="my-attendance-title">My Attendance</h1>
        <a href="/dashboard" className="my-attendance-back-btn">
          ← Back to Dashboard
        </a>
      </div>

      <div className="my-attendance-content">
        <div className="my-attendance-filter-section">
          <div className="my-attendance-filter-group">
            <label className="my-attendance-label">
              Filter by Date (optional):
            </label>
            <input
              type="date"
              className="my-attendance-date-input"
              value={dateFilter}
              onChange={function (e) {
                setDateFilter(e.target.value);
              }}
            />
          </div>
          <button className="my-attendance-load-btn" onClick={loadMyAttendance}>
            Load Attendance
          </button>
        </div>

        {isLoaded === true && attendanceRecords.length > 0 && (
          <div className="my-attendance-stats">
            <div className="my-attendance-stat-item">
              <span className="my-attendance-stat-label">Total:</span>
              <span className="my-attendance-stat-value">
                {attendanceRecords.length}
              </span>
            </div>
            <div className="my-attendance-stat-item">
              <span className="my-attendance-stat-label">Present:</span>
              <span className="my-attendance-stat-value my-stat-present">
                {presentCount}
              </span>
            </div>
            <div className="my-attendance-stat-item">
              <span className="my-attendance-stat-label">Absent:</span>
              <span className="my-attendance-stat-value my-stat-absent">
                {absentCount}
              </span>
            </div>
          </div>
        )}

        {isLoaded === true && attendanceRecords.length > 0 && (
          <div className="my-attendance-table-section">
            <div className="my-attendance-table-wrapper">
              <table className="my-attendance-table">
                <thead>
                  <tr>
                    <th className="my-attendance-th">#</th>
                    <th className="my-attendance-th">Name</th>
                    <th className="my-attendance-th">Date</th>
                    <th className="my-attendance-th">Status</th>
                    <th className="my-attendance-th">Marked By</th>
                  </tr>
                </thead>
                <tbody>{recordRows}</tbody>
              </table>
            </div>
          </div>
        )}

        {isLoaded === true && attendanceRecords.length === 0 && (
          <div className="my-attendance-empty">
            <div className="my-attendance-empty-icon">📋</div>
            <p>No attendance records found.</p>
            <p>Your trainer has not marked your attendance yet.</p>
          </div>
        )}

        {isLoaded === false && (
          <div className="my-attendance-empty">
            <div className="my-attendance-empty-icon">📋</div>
            <p>Click Load Attendance to view your attendance records.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyAttendance;

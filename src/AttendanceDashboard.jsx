import { useState } from "react";
import "./AttendanceDashboard.css";
import AttendanceStatsCard from "./AttendanceStatsCard";
import AttendanceFilters from "./AttendanceFilters";
import AttendanceTable from "./AttendanceTable";
import AttendanceCard from "./AttendanceCard";
import AttendanceDetailsModal from "./AttendanceDetailsModal";

function AttendanceDashboard() {
  var [attendanceList, setAttendanceList] = useState([]);
  var [isLoading, setIsLoading] = useState(false);
  var [isLoaded, setIsLoaded] = useState(false);
  var [errorMessage, setErrorMessage] = useState("");
  var [searchText, setSearchText] = useState("");
  var [sessionFilter, setSessionFilter] = useState("All");
  var [statusFilter, setStatusFilter] = useState("All");
  var [dateFilter, setDateFilter] = useState("");
  var [selectedRecord, setSelectedRecord] = useState(null);
  var [isModalOpen, setIsModalOpen] = useState(false);
  var loggedInUser = localStorage.getItem("loggedInUser");
  if (loggedInUser === null) {
    window.location.href = "/access-denied";
    return null;
  }
  var userData = JSON.parse(loggedInUser);
  if (userData.role !== "Trainer" && userData.role !== "Admin") {
    window.location.href = "/access-denied";
    return null;
  }
  function getToken() {
    return localStorage.getItem("token");
  }
  function loadAttendanceRecords() {
    setIsLoading(true);
    setErrorMessage("");

    fetch("/api/attendance", {
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
          setAttendanceList(data.records);
        } else {
          setErrorMessage("Could not load attendance records.");
        }
        setIsLoading(false);
        setIsLoaded(true);
      })
      .catch(function (error) {
        console.error(error);
        setErrorMessage(
          "Something went wrong while loading attendance. Please try again.",
        );
        setIsLoading(false);
        setIsLoaded(true);
      });
  }
  if (isLoaded === false && isLoading === false) {
    loadAttendanceRecords();
  }
  var totalStudents = attendanceList.length;
  var presentCount = 0;
  var absentCount = 0;
  var lateCount = 0;

  for (var s = 0; s < attendanceList.length; s++) {
    if (attendanceList[s].status === "Present") {
      presentCount = presentCount + 1;
    } else if (attendanceList[s].status === "Absent") {
      absentCount = absentCount + 1;
    } else if (attendanceList[s].status === "Late") {
      lateCount = lateCount + 1;
    }
  }
  var attendancePercentage = 0;
  if (totalStudents > 0) {
    attendancePercentage = Math.round((presentCount / totalStudents) * 100);
  }
  var sessionOptions = [];
  for (var u = 0; u < attendanceList.length; u++) {
    var sessName = attendanceList[u].sessionId || attendanceList[u].date || "";
    if (sessName !== "") {
      var alreadyExists = false;
      for (var v = 0; v < sessionOptions.length; v++) {
        if (sessionOptions[v] === sessName) {
          alreadyExists = true;
        }
      }
      if (alreadyExists === false) {
        sessionOptions.push(sessName);
      }
    }
  }
  var filteredRecords = [];
  for (var i = 0; i < attendanceList.length; i++) {
    var record = attendanceList[i];
    var matchesSearch = true;
    if (searchText !== "") {
      var nameToCheck =
        record.studentName || record.studentEmail || record.userId || "";
      var nameLower = nameToCheck.toLowerCase();
      var searchLower = searchText.toLowerCase();
      if (nameLower.indexOf(searchLower) === -1) {
        matchesSearch = false;
      }
    }
    var matchesSession = true;
    if (sessionFilter !== "All") {
      var recordSession = record.sessionId || record.date || "";
      if (recordSession !== sessionFilter) {
        matchesSession = false;
      }
    }
    var matchesStatus = true;
    if (statusFilter !== "All") {
      if (record.status !== statusFilter) {
        matchesStatus = false;
      }
    }
    var matchesDate = true;
    if (dateFilter !== "") {
      var recordDate = "";
      if (record.date) {
        recordDate = record.date;
      } else if (record.joinTime) {
        var joinDateObj = new Date(record.joinTime);
        var year = joinDateObj.getFullYear();
        var month = String(joinDateObj.getMonth() + 1);
        if (month.length === 1) {
          month = "0" + month;
        }
        var day = String(joinDateObj.getDate());
        if (day.length === 1) {
          day = "0" + day;
        }
        recordDate = year + "-" + month + "-" + day;
      }
      if (recordDate !== dateFilter) {
        matchesDate = false;
      }
    }
    if (
      matchesSearch === true &&
      matchesSession === true &&
      matchesStatus === true &&
      matchesDate === true
    ) {
      filteredRecords.push(record);
    }
  }
  function handleViewDetails(record) {
    setSelectedRecord(record);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setSelectedRecord(null);
  }

  return (
    <div className="att-dash-page">
      <div className="att-dash-header">
        <h1 className="att-dash-title">Attendance Dashboard</h1>
        <a href="/dashboard" className="att-dash-back-btn">
          ← Back to Dashboard
        </a>
      </div>
      <div className="att-dash-content">
        {errorMessage !== "" && (
          <div className="att-dash-error-box">{errorMessage}</div>
        )}
        {isLoading === true && (
          <div className="att-dash-loading">
            <div className="att-dash-spinner"></div>
            <p>Loading attendance records...</p>
          </div>
        )}
        {isLoading === false && isLoaded === true && errorMessage === "" && (
          <>
            <AttendanceStatsCard
              totalStudents={totalStudents}
              presentCount={presentCount}
              absentCount={absentCount}
              attendancePercentage={attendancePercentage}
            />
            <AttendanceFilters
              searchText={searchText}
              onSearchChange={setSearchText}
              sessionFilter={sessionFilter}
              onSessionFilterChange={setSessionFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              sessionOptions={sessionOptions}
            />
            {filteredRecords.length > 0 ? (
              <AttendanceCard>
                <h2 className="att-dash-section-title">Attendance Records</h2>
                <AttendanceTable
                  records={filteredRecords}
                  onViewDetails={handleViewDetails}
                />
              </AttendanceCard>
            ) : (
              <div className="att-dash-empty">
                <div className="att-dash-empty-icon">📋</div>
                <p>No attendance records found.</p>
              </div>
            )}
          </>
        )}
      </div>
      {isModalOpen === true && (
        <AttendanceDetailsModal
          record={selectedRecord}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default AttendanceDashboard;

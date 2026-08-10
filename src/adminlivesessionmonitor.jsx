import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./adminlivesessionmonitor.css";

function AdminLiveSessionMonitor() {
  var navigate = useNavigate();
  var loggedInUser = localStorage.getItem("loggedInUser");
  if (loggedInUser === null) {
    window.location.href = "/access-denied";
    return null;
  }
  var currentUser = JSON.parse(loggedInUser);
  if (currentUser.role !== "Admin") {
    window.location.href = "/access-denied";
    return null;
  }

  var [sessions, setSessions] = useState([]);
  var [statusFilter, setStatusFilter] = useState("Live");
  var [isLoading, setIsLoading] = useState(true);
  var [errorMessage, setErrorMessage] = useState("");
  var [selectedRoomId, setSelectedRoomId] = useState(null);
  var [detailStats, setDetailStats] = useState(null);
  var [detailAttendance, setDetailAttendance] = useState(null);
  var [detailLoading, setDetailLoading] = useState(false);
  var [detailError, setDetailError] = useState("");
  var [endingRoomId, setEndingRoomId] = useState(null);

  function getToken() {
    return localStorage.getItem("token");
  }

  function fetchSessions() {
    setErrorMessage("");
    fetch("/api/admin/live-sessions?status=" + statusFilter, {
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
        if (!data) return;
        if (data.success) {
          setSessions(data.sessions);
        } else {
          setErrorMessage(data.message || "Failed to load live sessions.");
        }
      })
      .catch(function (error) {
        console.error("Error fetching live sessions:", error);
        setErrorMessage("Server or network error. Is the backend running?");
      })
      .finally(function () {
        setIsLoading(false);
      });
  }

  useEffect(() => {
    setIsLoading(true);
    fetchSessions();
    var intervalId = setInterval(fetchSessions, 6000);
    return function () {
      clearInterval(intervalId);
    };
  }, [statusFilter]);

  function handleStatusFilterChange(e) {
    setStatusFilter(e.target.value);
  }

  function joinWatchSession(roomId) {
    window.open("/live-classroom/" + roomId, "_blank");
  }

  function openDetails(roomId) {
    setSelectedRoomId(roomId);
    setDetailStats(null);
    setDetailAttendance(null);
    setDetailError("");
    setDetailLoading(true);

    var token = getToken();
    Promise.all([
      fetch("/api/admin/live-sessions/" + roomId + "/stats", {
        headers: { Authorization: "Bearer " + token },
      }).then(function (r) {
        return r.json();
      }),
      fetch("/api/admin/live-sessions/" + roomId + "/attendance-summary", {
        headers: { Authorization: "Bearer " + token },
      }).then(function (r) {
        return r.json();
      }),
    ])
      .then(function (results) {
        var statsData = results[0];
        var attendanceData = results[1];
        if (statsData.success) {
          setDetailStats(statsData.stats);
        } else {
          setDetailError(statsData.message || "Failed to load session statistics.");
        }
        if (attendanceData.success) {
          setDetailAttendance(attendanceData);
        }
      })
      .catch(function (error) {
        console.error("Error fetching session details:", error);
        setDetailError("Server or network error while loading details.");
      })
      .finally(function () {
        setDetailLoading(false);
      });
  }

  function closeDetails() {
    setSelectedRoomId(null);
    setDetailStats(null);
    setDetailAttendance(null);
    setDetailError("");
  }

  function forceEndSession(roomId) {
    var confirmEnd = window.confirm(
      "Force end this live session for all participants? This cannot be undone.",
    );
    if (!confirmEnd) return;

    setEndingRoomId(roomId);
    fetch("/api/admin/live-sessions/" + roomId + "/end", {
      method: "POST",
      headers: { Authorization: "Bearer " + getToken() },
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          fetchSessions();
          if (selectedRoomId === roomId) closeDetails();
        } else {
          alert(data.message || "Failed to end session.");
        }
      })
      .catch(function (error) {
        console.error("Error force-ending session:", error);
        alert("Failed to end session. Please try again.");
      })
      .finally(function () {
        setEndingRoomId(null);
      });
  }

  function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return "0m 0s";
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    return mins + "m " + secs + "s";
  }

  function formatTimestamp(value) {
    if (!value) return "-";
    var d = new Date(value);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
  }

  var selectedSessionCard = null;
  for (var si = 0; si < sessions.length; si++) {
    if (sessions[si].roomId === selectedRoomId) {
      selectedSessionCard = sessions[si];
      break;
    }
  }

  var sessionCards = sessions.map(function (s) {
    var isLive = s.live && s.live.isLive;
    return (
      <div className="alm-card" key={s.roomId}>
        <div className="alm-card-header">
          <h3>{s.batch || s.name}</h3>
          <span className={"alm-status alm-status-" + s.status.toLowerCase()}>
            {s.status}
          </span>
        </div>
        {s.integrity && s.integrity.hasWarning && (
          <div className="alm-integrity-badge" title={s.integrity.warnings.join(" | ")}>
            Data check
          </div>
        )}
        <div className="alm-card-body">
          <p><b>Room:</b> {s.roomId}</p>
          <p><b>Trainer:</b> {s.trainer}</p>
          <p><b>Date:</b> {s.date} · {s.time}</p>
          <p>
            <b>Active now:</b>{" "}
            {isLive ? s.live.activeParticipants : 0}
            {"  "}
            <b>Joined total:</b> {isLive ? s.live.totalJoined : 0}
          </p>
          <p>
            <b>Duration:</b>{" "}
            {isLive ? formatDuration(s.live.durationSeconds) : "-"}
          </p>
        </div>
        <div className="alm-card-actions">
          <button
            className="alm-btn-join"
            onClick={function () {
              joinWatchSession(s.roomId);
            }}
            disabled={!isLive}
          >
            Join / Watch
          </button>
          <button
            className="alm-btn-details"
            onClick={function () {
              openDetails(s.roomId);
            }}
          >
            Details
          </button>
          <button
            className="alm-btn-end"
            disabled={!isLive || endingRoomId === s.roomId}
            onClick={function () {
              forceEndSession(s.roomId);
            }}
          >
            {endingRoomId === s.roomId ? "Ending..." : "Force End"}
          </button>
        </div>
      </div>
    );
  });

  var maxAttendanceBar = 1;
  if (detailAttendance) {
    var t = detailAttendance.totals;
    maxAttendanceBar = Math.max(1, t.present, t.absent, t.late);
  }

  return (
    <div className="alm-page">
      <div className="alm-header">
        <h1>Live Session Monitoring</h1>
        <p className="alm-subtitle">
          Watch active classes, review performance, and step in when needed.
        </p>
      </div>

      <div className="alm-filters">
        <label htmlFor="alm-status-filter">Status:</label>
        <select
          id="alm-status-filter"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          className="alm-select"
        >
          <option value="Live">Live</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Completed">Completed</option>
          <option value="All">All</option>
        </select>
        <button className="alm-btn-refresh" onClick={fetchSessions}>
          Refresh
        </button>
      </div>

      {isLoading && <div className="alm-status-msg">Loading sessions...</div>}
      {!isLoading && errorMessage !== "" && (
        <div className="alm-status-msg alm-error">{errorMessage}</div>
      )}
      {!isLoading && errorMessage === "" && sessions.length === 0 && (
        <div className="alm-status-msg">No sessions found for this filter.</div>
      )}
      {!isLoading && sessions.length > 0 && (
        <div className="alm-grid">{sessionCards}</div>
      )}

      {selectedRoomId !== null && (
        <div className="alm-modal-overlay" onClick={closeDetails}>
          <div className="alm-modal" onClick={function (e) { e.stopPropagation(); }}>
            <button className="alm-modal-close" onClick={closeDetails}>✕</button>
            <h2>
              Session Details —{" "}
              {selectedSessionCard ? (selectedSessionCard.batch || selectedSessionCard.name) : selectedRoomId}
            </h2>

            {detailLoading && <div className="alm-status-msg">Loading details...</div>}
            {!detailLoading && detailError !== "" && (
              <div className="alm-status-msg alm-error">{detailError}</div>
            )}

            {!detailLoading && detailStats && (
              <>
                <div className="alm-detail-section">
                  <h3>Session Performance</h3>
                  <div className="alm-detail-stats-grid">
                    <div className="alm-detail-stat">
                      <div className="alm-detail-stat-label">Status</div>
                      <div className="alm-detail-stat-value">{detailStats.status}</div>
                    </div>
                    <div className="alm-detail-stat">
                      <div className="alm-detail-stat-label">Active Participants</div>
                      <div className="alm-detail-stat-value">{detailStats.activeParticipants}</div>
                    </div>
                    <div className="alm-detail-stat">
                      <div className="alm-detail-stat-label">Total Joined</div>
                      <div className="alm-detail-stat-value">{detailStats.totalJoined}</div>
                    </div>
                    <div className="alm-detail-stat">
                      <div className="alm-detail-stat-label">Waiting Room</div>
                      <div className="alm-detail-stat-value">{detailStats.waitingCount}</div>
                    </div>
                    <div className="alm-detail-stat">
                      <div className="alm-detail-stat-label">Duration</div>
                      <div className="alm-detail-stat-value">
                        {formatDuration(detailStats.durationSeconds)}
                      </div>
                    </div>
                  </div>
                </div>

                {detailAttendance && (
                  <div className="alm-detail-section">
                    <h3>Attendance Summary</h3>
                    <div className="alm-attendance-chart-wrap">
                      <svg viewBox="0 0 300 160" className="alm-attendance-chart-svg">
                        {[
                          { label: "Present", value: detailAttendance.totals.present, color: "#2e7d32" },
                          { label: "Late", value: detailAttendance.totals.late, color: "#e65100" },
                          { label: "Absent", value: detailAttendance.totals.absent, color: "#c62828" },
                        ].map(function (bar, index) {
                          var barHeight = (bar.value / maxAttendanceBar) * 110;
                          var x = 30 + index * 90;
                          var y = 135 - barHeight;
                          return (
                            <g key={bar.label}>
                              <rect x={x} y={y} width="50" height={barHeight} fill={bar.color} rx="4" />
                              <text x={x + 25} y="150" textAnchor="middle" fontSize="12">{bar.label}</text>
                              <text x={x + 25} y={y - 6} textAnchor="middle" fontSize="12" fontWeight="bold">
                                {bar.value}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                    <table className="alm-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Status</th>
                          <th>Join Time</th>
                          <th>Leave Time</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailAttendance.attendance.length === 0 && (
                          <tr>
                            <td colSpan="5" className="alm-empty-row">No attendance recorded yet.</td>
                          </tr>
                        )}
                        {detailAttendance.attendance.map(function (row, idx) {
                          return (
                            <tr key={idx}>
                              <td>{row.studentName}</td>
                              <td>
                                <span className={"alm-attendance-badge alm-attendance-" + row.status.toLowerCase()}>
                                  {row.status}
                                </span>
                              </td>
                              <td>{formatTimestamp(row.joinTime)}</td>
                              <td>{formatTimestamp(row.leaveTime)}</td>
                              <td>{row.durationMinutes !== null ? row.durationMinutes + "m" : "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="alm-detail-section">
                  <h3>Participants Currently Connected</h3>
                  <table className="alm-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Mic</th>
                        <th>Camera</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!detailStats.participants || detailStats.participants.length === 0) && (
                        <tr>
                          <td colSpan="5" className="alm-empty-row">No one is currently connected.</td>
                        </tr>
                      )}
                      {detailStats.participants && detailStats.participants.map(function (p) {
                        return (
                          <tr key={p.userId}>
                            <td>{p.name}</td>
                            <td>{p.role}</td>
                            <td>{p.status}</td>
                            <td>{p.mic ? "On" : "Off"}</td>
                            <td>{p.camera ? "On" : "Off"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="alm-detail-actions">
                  <button
                    className="alm-btn-join"
                    onClick={function () { joinWatchSession(selectedRoomId); }}
                    disabled={!detailStats.isLive}
                  >
                    Join / Watch
                  </button>
                  <button
                    className="alm-btn-end"
                    disabled={!detailStats.isLive || endingRoomId === selectedRoomId}
                    onClick={function () { forceEndSession(selectedRoomId); }}
                  >
                    {endingRoomId === selectedRoomId ? "Ending..." : "Force End Session"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLiveSessionMonitor;
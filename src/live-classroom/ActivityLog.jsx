import { useState, useEffect } from "react";
import "./ParticipantPanel.css";
function formatTime(isoString) {
  var d = new Date(isoString);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
function getHumanReadableDescription(log) {
  var actor = log.actorName || "Someone";
  var target = log.targetName ? " " + log.targetName : "";

  switch (log.eventType) {
    case "participant:joined":
      return actor + " joined the session.";
    case "participant:left":
      return actor + " left the session.";
    case "participant:removed":
      return actor + " removed" + target + " from the session.";
    case "hand:raise":
      return actor + " raised their hand.";
    case "hand:lower":
      return actor + " lowered their hand.";
    case "mic:toggle":
      if (log.metadata && log.metadata.mic !== undefined) {
        return (
          actor + (log.metadata.mic ? " unmuted" : " muted") + " their mic."
        );
      }
      return actor + " toggled their mic.";
    case "mic:muteOne":
      return actor + " muted" + target + "'s mic.";
    case "mic:muteAll":
      var count = log.metadata ? log.metadata.affectedCount : 0;
      return actor + " muted all participants (" + count + " affected).";
    case "camera:toggle":
      if (log.metadata && log.metadata.camera !== undefined) {
        return (
          actor +
          " turned " +
          (log.metadata.camera ? "on" : "off") +
          " their camera."
        );
      }
      return actor + " toggled their camera.";
    default:
      return (
        actor + " triggered " + log.eventType + (target ? " on" + target : "")
      );
  }
}

export default function ActivityLog({ roomId, onClose }) {
  var [logs, setLogs] = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(
    function () {
      var token = localStorage.getItem("token");
      if (!token) return;

      fetch("/api/activity-logs/" + roomId + "?limit=100", {
        headers: {
          Authorization: "Bearer " + token,
        },
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (data.success) {
            setLogs(data.data || []);
          }
        })
        .catch(function (err) {
          console.error("Failed to load activity logs:", err);
        })
        .finally(function () {
          setLoading(false);
        });
    },
    [roomId],
  );

  return (
    <div className="pp-panel">
      <div className="pp-header">
        <div className="pp-header-title">
          <span>Activity Log</span>
        </div>
        <button className="pp-close-btn" onClick={onClose} title="Close">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="pp-list" style={{ marginTop: "10px", padding: "0 10px" }}>
        {loading ? (
          <div className="pp-empty">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="pp-empty">No recent activity</div>
        ) : (
          logs.map(function (log) {
            return (
              <div
                key={log._id}
                style={{
                  padding: "8px 10px",
                  borderBottom: "1px solid #3f3f46",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div style={{ fontSize: "11px", color: "#8a9ab5" }}>
                  {formatTime(log.timestamp)}
                </div>
                <div style={{ fontSize: "13px", color: "#e4e4e7" }}>
                  {getHumanReadableDescription(log)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import { useState, useMemo, useCallback } from "react";
import "./ParticipantPanel.css";
function IconSearch() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function IconX() {
  return (
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
  );
}
function IconCheck() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function WaitingRoomRow({ userId, entry, onApprove, onReject }) {
  var initials = (entry.name || "?").charAt(0).toUpperCase();

  return (
    <div className="pp-row" data-user-id={userId}>
      <div className="pp-row-avatar">{initials}</div>
      <div className="pp-row-info">
        <span className="pp-row-name">{entry.name || userId}</span>
        <span className="pp-row-status pp-badge-disconnected">Waiting</span>
      </div>
      <div className="pp-row-actions" style={{ opacity: 1 }}>
        <button
          className="pp-action-btn pp-action-reinvite"
          title="Approve"
          onClick={function () {
            onApprove(userId);
          }}
        >
          <IconCheck />
        </button>
        <button
          className="pp-action-btn pp-action-remove"
          title="Reject"
          onClick={function () {
            onReject(userId);
          }}
        >
          <IconX />
        </button>
      </div>
    </div>
  );
}

function WaitingRoomPanel({ waitingRoom, onClose, socketRef, roomId }) {
  var [search, setSearch] = useState("");

  var filteredList = useMemo(
    function () {
      var q = search.trim().toLowerCase();
      if (!q) return waitingRoom;
      return waitingRoom.filter(function (entry) {
        return (
          (entry.name || "").toLowerCase().indexOf(q) !== -1 ||
          (entry.userId || "").toLowerCase().indexOf(q) !== -1
        );
      });
    },
    [waitingRoom, search],
  );

  var handleApprove = useCallback(
    function (targetUserId) {
      if (!socketRef || !socketRef.current) return;
      socketRef.current.emit("waitingRoom:approve", {
        roomId: roomId,
        targetUserId: targetUserId,
      });
    },
    [socketRef, roomId],
  );

  var handleReject = useCallback(
    function (targetUserId) {
      if (!socketRef || !socketRef.current) return;
      socketRef.current.emit("waitingRoom:reject", {
        roomId: roomId,
        targetUserId: targetUserId,
      });
    },
    [socketRef, roomId],
  );

  var handleApproveAll = useCallback(
    function () {
      if (!socketRef || !socketRef.current) return;
      waitingRoom.forEach(function (entry) {
        socketRef.current.emit("waitingRoom:approve", {
          roomId: roomId,
          targetUserId: entry.userId,
        });
      });
    },
    [socketRef, roomId, waitingRoom],
  );

  return (
    <div className="pp-panel">
      <div className="pp-header">
        <div className="pp-header-title">
          <span>Waiting Room</span>
          <span className="pp-header-count">{waitingRoom.length}</span>
        </div>
        <button className="pp-close-btn" onClick={onClose} title="Close">
          <IconX />
        </button>
      </div>
      <div className="pp-search-wrapper">
        <IconSearch />
        <input
          className="pp-search-input"
          type="text"
          placeholder="Search waiting…"
          value={search}
          onChange={function (e) {
            setSearch(e.target.value);
          }}
        />
        {search && (
          <button
            className="pp-search-clear"
            onClick={function () {
              setSearch("");
            }}
          >
            <IconX />
          </button>
        )}
      </div>
      {waitingRoom.length > 0 && (
        <div
          style={{
            padding: "12px 16px 4px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={handleApproveAll}
            style={{
              background: "rgba(99, 102, 241, 0.15)",
              color: "#818cf8",
              border: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) =>
              (e.target.style.background = "rgba(99, 102, 241, 0.25)")
            }
            onMouseOut={(e) =>
              (e.target.style.background = "rgba(99, 102, 241, 0.15)")
            }
          >
            Approve All
          </button>
        </div>
      )}
      <div className="pp-list">
        {filteredList.length === 0 ? (
          <div className="pp-empty">
            {search ? "No matches found" : "Waiting room is empty"}
          </div>
        ) : (
          filteredList.map(function (entry) {
            return (
              <WaitingRoomRow
                key={entry.userId}
                userId={entry.userId}
                entry={entry}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default WaitingRoomPanel;

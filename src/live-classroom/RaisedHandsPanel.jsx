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

function RaisedHandRow({ userId, entry, onApprove, onDismiss }) {
  var initials = (entry.name || "?").charAt(0).toUpperCase();

  return (
    <div className="pp-row" data-user-id={userId}>
      <div className="pp-row-avatar">{initials}</div>
      <div className="pp-row-info">
        <span className="pp-row-name">{entry.name || userId}</span>
        <span className="pp-row-status pp-badge-active">Hand Raised</span>
      </div>
      <div className="pp-row-actions" style={{ opacity: 1 }}>
        <button
          className="pp-action-btn pp-action-reinvite"
          title="Approve to Speak"
          onClick={function () {
            onApprove(userId);
          }}
        >
          <IconCheck />
        </button>
        <button
          className="pp-action-btn pp-action-remove"
          title="Dismiss Hand"
          onClick={function () {
            onDismiss(userId);
          }}
        >
          <IconX />
        </button>
      </div>
    </div>
  );
}

function RaisedHandsPanel({ participants, onClose, socketRef, roomId }) {
  var [search, setSearch] = useState("");

  var raisedHands = useMemo(
    function () {
      var hands = [];
      Object.entries(participants).forEach(function ([userId, p]) {
        if (p.hand && p.status === "active") {
          hands.push({ userId: userId, ...p });
        }
      });
      hands.sort(function (a, b) {
        var timeA = a.raisedAt ? new Date(a.raisedAt).getTime() : 0;
        var timeB = b.raisedAt ? new Date(b.raisedAt).getTime() : 0;
        return timeA - timeB;
      });
      return hands;
    },
    [participants],
  );

  var filteredList = useMemo(
    function () {
      var q = search.trim().toLowerCase();
      if (!q) return raisedHands;
      return raisedHands.filter(function (entry) {
        return (
          (entry.name || "").toLowerCase().indexOf(q) !== -1 ||
          (entry.userId || "").toLowerCase().indexOf(q) !== -1
        );
      });
    },
    [raisedHands, search],
  );

  var handleApprove = useCallback(
    function (targetUserId) {
      if (!socketRef || !socketRef.current) return;
      socketRef.current.emit("hand:approve", {
        roomId: roomId,
        targetUserId: targetUserId,
      });
    },
    [socketRef, roomId],
  );

  var handleDismiss = useCallback(
    function (targetUserId) {
      if (!socketRef || !socketRef.current) return;
      socketRef.current.emit("hand:dismiss", {
        roomId: roomId,
        targetUserId: targetUserId,
      });
    },
    [socketRef, roomId],
  );

  return (
    <div className="pp-panel">
      <div className="pp-header">
        <div className="pp-header-title">
          <span>Raised Hands</span>
          <span className="pp-header-count">{raisedHands.length}</span>
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
          placeholder="Search hands…"
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
      <div className="pp-list">
        {filteredList.length === 0 ? (
          <div className="pp-empty">
            {search ? "No matches found" : "No hands raised"}
          </div>
        ) : (
          filteredList.map(function (entry) {
            return (
              <RaisedHandRow
                key={entry.userId}
                userId={entry.userId}
                entry={entry}
                onApprove={handleApprove}
                onDismiss={handleDismiss}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default RaisedHandsPanel;

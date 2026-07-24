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
function IconUserRemove() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="18" y1="8" x2="23" y2="13" />
      <line x1="23" y1="8" x2="18" y2="13" />
    </svg>
  );
}
function IconUserPlus() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}
function IconMicOff() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.12 1.5-.34 2.18" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
function IconMic() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
function IconCamera() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

var STATUS_STYLES = {
  active: { label: "Active", className: "pp-badge-active" },
  disconnected: { label: "Reconnecting…", className: "pp-badge-disconnected" },
  removed: { label: "Removed", className: "pp-badge-removed" },
};

function ParticipantRow({
  userId,
  participant,
  isTrainer,
  onRemove,
  onAllowRejoin,
  onMuteOne,
  onAllowUnmute,
  onRequestCamera,
}) {
  var p = participant;
  var initials = (p.name || "?").charAt(0).toUpperCase();
  var statusInfo = STATUS_STYLES[p.status] || STATUS_STYLES.active;

  return (
    <div
      className={"pp-row" + (p.status !== "active" ? " pp-row-inactive" : "")}
      data-user-id={userId}
    >
      <div className="pp-row-avatar">{initials}</div>
      <div className="pp-row-info">
        <span className="pp-row-name">
          {p.name || userId}
          {p.role === "Trainer" && (
            <span className="pp-row-host-tag">Host</span>
          )}
        </span>
        <span className={"pp-row-status " + statusInfo.className}>
          {statusInfo.label}
        </span>
      </div>
      {isTrainer && p.role !== "Trainer" && p.role !== "Admin" && (
        <div className="pp-row-actions">
          {(p.status === "active" || p.status === "disconnected") && (
            <>
              {p.micLocked ? (
                <button
                  className="pp-action-btn pp-action-reinvite"
                  title="Allow unmute"
                  onClick={function () {
                    onAllowUnmute(userId);
                  }}
                >
                  <IconMic />
                </button>
              ) : (
                <button
                  className="pp-action-btn pp-action-remove"
                  title="Mute participant"
                  onClick={function () {
                    onMuteOne(userId);
                  }}
                >
                  <IconMicOff />
                </button>
              )}
              {!p.camera && (
                <button
                  className="pp-action-btn pp-action-reinvite"
                  title="Ask to enable camera"
                  onClick={function () {
                    onRequestCamera(userId);
                  }}
                >
                  <IconCamera />
                </button>
              )}
              <button
                className="pp-action-btn pp-action-remove"
                title="Remove participant"
                onClick={function () {
                  onRemove(userId);
                }}
              >
                <IconUserRemove />
              </button>
            </>
          )}
          {p.status === "removed" && (
            <button
              className="pp-action-btn pp-action-reinvite"
              title="Allow rejoin"
              onClick={function () {
                onAllowRejoin(userId);
              }}
            >
              <IconUserPlus />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
function ParticipantPanel({
  participants,
  isTrainer,
  onClose,
  socketRef,
  roomId,
}) {
  var [search, setSearch] = useState("");
  var filteredEntries = useMemo(
    function () {
      var entries = Object.entries(participants);
      var q = search.trim().toLowerCase();
      if (q) {
        entries = entries.filter(function (entry) {
          var userId = entry[0];
          var p = entry[1];
          return (
            (p.name || "").toLowerCase().indexOf(q) !== -1 ||
            userId.toLowerCase().indexOf(q) !== -1
          );
        });
      }
      entries.sort(function (a, b) {
        var order = { active: 0, disconnected: 1, removed: 2 };
        var sa = order[a[1].status] !== undefined ? order[a[1].status] : 3;
        var sb = order[b[1].status] !== undefined ? order[b[1].status] : 3;
        if (sa !== sb) return sa - sb;
        var ra = a[1].role === "Trainer" || a[1].role === "Admin" ? 0 : 1;
        var rb = b[1].role === "Trainer" || b[1].role === "Admin" ? 0 : 1;
        if (ra !== rb) return ra - rb;
        return (a[1].name || "").localeCompare(b[1].name || "");
      });
      return entries;
    },
    [participants, search],
  );

  var counts = useMemo(
    function () {
      var a = 0,
        d = 0,
        r = 0;
      var entries = Object.values(participants);
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].status === "active") a++;
        else if (entries[i].status === "disconnected") d++;
        else if (entries[i].status === "removed") r++;
      }
      return { active: a, disconnected: d, removed: r, total: entries.length };
    },
    [participants],
  );

  var handleRemove = useCallback(
    function (targetUserId) {
      if (!socketRef || !socketRef.current) return;
      socketRef.current.emit("participant:remove", {
        roomId: roomId,
        targetUserId: targetUserId,
      });
    },
    [socketRef, roomId],
  );

  var handleAllowRejoin = useCallback(
    function (targetUserId) {
      if (!socketRef || !socketRef.current) return;
      socketRef.current.emit("participant:allowRejoin", {
        roomId: roomId,
        targetUserId: targetUserId,
      });
    },
    [socketRef, roomId],
  );

  var handleMuteOne = useCallback(
    function (targetUserId) {
      if (!socketRef || !socketRef.current) return;
      socketRef.current.emit("mic:muteOne", {
        roomId: roomId,
        targetUserId: targetUserId,
      });
    },
    [socketRef, roomId],
  );

  var handleAllowUnmute = useCallback(
    function (targetUserId) {
      if (!socketRef || !socketRef.current) return;
      socketRef.current.emit("mic:allowUnmute", {
        roomId: roomId,
        targetUserId: targetUserId,
      });
    },
    [socketRef, roomId],
  );

  var handleRequestCamera = useCallback(
    function (targetUserId) {
      if (!socketRef || !socketRef.current) return;
      socketRef.current.emit("camera:request", {
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
          <span>Participants</span>
          <span className="pp-header-count">{counts.active}</span>
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
          placeholder="Search by name or email…"
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
      <div className="pp-stats">
        <span className="pp-stat pp-stat-active">{counts.active} active</span>
        {counts.disconnected > 0 && (
          <span className="pp-stat pp-stat-disconnected">
            {counts.disconnected} reconnecting
          </span>
        )}
        {counts.removed > 0 && (
          <span className="pp-stat pp-stat-removed">
            {counts.removed} removed
          </span>
        )}
      </div>
      <div className="pp-list">
        {filteredEntries.length === 0 ? (
          <div className="pp-empty">
            {search ? "No matches found" : "No participants yet"}
          </div>
        ) : (
          filteredEntries.map(function (entry) {
            return (
              <ParticipantRow
                key={entry[0]}
                userId={entry[0]}
                participant={entry[1]}
                isTrainer={isTrainer}
                onRemove={handleRemove}
                onAllowRejoin={handleAllowRejoin}
                onMuteOne={handleMuteOne}
                onAllowUnmute={handleAllowUnmute}
                onRequestCamera={handleRequestCamera}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default ParticipantPanel;

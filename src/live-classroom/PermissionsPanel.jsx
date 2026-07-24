import { useMemo, useCallback } from "react";
import "./ParticipantPanel.css";

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

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label
      onClick={onChange}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        cursor: "pointer",
        fontSize: "11px",
        color: "#ccc",
      }}
    >
      <div
        style={{
          width: "28px",
          height: "16px",
          borderRadius: "8px",
          background: checked ? "#4ade80" : "#3f3f46",
          position: "relative",
          transition: "background 0.2s",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: "#fff",
            position: "absolute",
            top: "2px",
            left: checked ? "14px" : "2px",
            transition: "left 0.2s",
          }}
        />
      </div>
      {label}
    </label>
  );
}

function PermissionRow({ userId, participant, onUpdate }) {
  var p = participant;
  var initials = (p.name || "?").charAt(0).toUpperCase();
  var perms = p.permissions || {
    canSpeak: true,
    canChat: true,
    canScreenShare: false,
  };

  var handleToggle = function (key, value) {
    var updates = {};
    updates[key] = value;
    onUpdate(userId, updates);
  };

  return (
    <div
      className="pp-row"
      style={{
        flexDirection: "column",
        alignItems: "stretch",
        padding: "12px",
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div className="pp-row-avatar">{initials}</div>
        <div className="pp-row-info" style={{ flex: 1 }}>
          <span className="pp-row-name">{p.name || userId}</span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingLeft: "42px",
        }}
      >
        <ToggleSwitch
          label="Speak"
          checked={perms.canSpeak}
          onChange={function () {
            handleToggle("canSpeak", !perms.canSpeak);
          }}
        />
        <ToggleSwitch
          label="Chat"
          checked={perms.canChat}
          onChange={function () {
            handleToggle("canChat", !perms.canChat);
          }}
        />
        <ToggleSwitch
          label="Share"
          checked={perms.canScreenShare}
          onChange={function () {
            handleToggle("canScreenShare", !perms.canScreenShare);
          }}
        />
      </div>
    </div>
  );
}

function PermissionsPanel({ participants, onClose, socketRef, roomId }) {
  var handleUpdate = useCallback(
    function (targetUserId, updates) {
      if (!socketRef || !socketRef.current) return;
      console.log("Emitting permissions:update", {
        targetUserId: targetUserId,
        updates: updates,
      });
      socketRef.current.emit("permissions:update", {
        roomId: roomId,
        targetUserId: targetUserId,
        updates: updates,
      });
    },
    [socketRef, roomId],
  );

  var studentEntries = useMemo(
    function () {
      var entries = Object.entries(participants);
      return entries.filter(function (entry) {
        return entry[1].role !== "Trainer" && entry[1].role !== "Admin";
      });
    },
    [participants],
  );

  return (
    <div className="pp-panel">
      <div className="pp-header">
        <div className="pp-header-title">
          <span>Permissions</span>
        </div>
        <button className="pp-close-btn" onClick={onClose} title="Close">
          <IconX />
        </button>
      </div>

      <div className="pp-list" style={{ marginTop: "10px" }}>
        {studentEntries.length === 0 ? (
          <div className="pp-empty">No students to manage</div>
        ) : (
          studentEntries.map(function (entry) {
            return (
              <PermissionRow
                key={entry[0]}
                userId={entry[0]}
                participant={entry[1]}
                onUpdate={handleUpdate}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default PermissionsPanel;

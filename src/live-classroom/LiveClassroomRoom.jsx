import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSocket, disconnect as disconnectSocket } from "./socket.js";
import ParticipantPanel from "./ParticipantPanel.jsx";
import WaitingRoom from "./WaitingRoom.jsx";
import WaitingRoomPanel from "./WaitingRoomPanel.jsx";
import RaisedHandsPanel from "./RaisedHandsPanel.jsx";
import PermissionsPanel from "./PermissionsPanel.jsx";
import ActivityLog from "./ActivityLog.jsx";
import NotificationToast from "./NotificationToast.jsx";
import useClassroomNotifications from "./useClassroomNotifications.js";
import useMedia from "./useMedia.js";
import useScreenShare from "./useScreenShare.js";
import Whiteboard from "../Whiteboard.jsx";
import ClassroomChat from "../ClassroomChat.jsx";
import "./LiveClassroomRoom.css";

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
function IconCameraOff() {
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
      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34" />
    </svg>
  );
}
function IconHand() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 11V6a2 2 0 0 0-4 0v1M14 10V4a2 2 0 0 0-4 0v6M10 10V5a2 2 0 0 0-4 0v9" />
      <path d="M18 11a2 2 0 0 1 4 0v3a8 8 0 0 1-8 8h-2c-2.76 0-4.68-1.08-6.36-2.79L3 16.5a1.5 1.5 0 0 1 2.12-2.12L6 15.25" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconWhiteboard() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}
function IconMore() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}
function IconLeave() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconActivity() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
function IconUnlock() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}
function IconEndCall() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1="23" y1="1" x2="1" y2="23" />
    </svg>
  );
}
function IconWaiting() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconMonitor() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}
function formatElapsed(seconds) {
  var h = Math.floor(seconds / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  var s = seconds % 60;
  var parts = [];
  if (h > 0) parts.push(String(h).padStart(2, "0"));
  parts.push(String(m).padStart(2, "0"));
  parts.push(String(s).padStart(2, "0"));
  return parts.join(":");
}
function LiveClassroomRoom() {
  var navigate = useNavigate();
  var params = useParams();
  var loggedInUser = localStorage.getItem("loggedInUser");
  if (!loggedInUser) {
    window.location.href = "/access-denied";
    return null;
  }
  var userData = JSON.parse(loggedInUser);
  var token = localStorage.getItem("token");
  var roomId =
    params.roomId ||
    window.sessionStorage.getItem("activeSessionId") ||
    "default";
  var isTrainer = userData.role === "Trainer" || userData.role === "Admin";
  var [participants, setParticipants] = useState({});
  var [locked, setLocked] = useState(false);
  var [elapsed, setElapsed] = useState(0);
  var [moreMenuOpen, setMoreMenuOpen] = useState(false);
  var [panelOpen, setPanelOpen] = useState(false);
  var [waitingPanelOpen, setWaitingPanelOpen] = useState(false);
  var [handsPanelOpen, setHandsPanelOpen] = useState(false);
  var [permissionsPanelOpen, setPermissionsPanelOpen] = useState(false);
  var [activityLogPanelOpen, setActivityLogPanelOpen] = useState(false);
  var [activePanel, setActivePanel] = useState(null);
  var [isWaiting, setIsWaiting] = useState(false);
  var [waitingRoomList, setWaitingRoomList] = useState([]);
  var [waitingRoomEnabled, setWaitingRoomEnabled] = useState(true);
  var socketRef = useRef(null);
  var timerRef = useRef(null);
  var media = useMedia();
  var screenShare = useScreenShare(
    socketRef.current,
    roomId,
    userData.email,
    participants,
  );
  useClassroomNotifications(socketRef, isTrainer);
  useEffect(
    function () {
      window.sessionStorage.setItem("activeSessionId", roomId);
    },
    [roomId],
  );
  useEffect(
    function () {
      if (!token) return;
      var sock = getSocket(roomId, token);
      socketRef.current = sock;
      function handleJoinAck(res) {
        if (res && res.ok && res.room) {
          if (res.waiting) {
            setIsWaiting(true);
          } else {
            setIsWaiting(false);
            setParticipants(res.room.participants || {});
          }
          setLocked(res.room.locked || false);
          setWaitingRoomList(res.room.waitingRoom || []);
          setWaitingRoomEnabled(res.room.waitingRoomEnabled !== false);
          if (res.room.startedAt) {
            var diff = Math.floor(
              (Date.now() - new Date(res.room.startedAt).getTime()) / 1000,
            );
            setElapsed(diff > 0 ? diff : 0);
          }
        }
      }
      function onConnect() {
        sock.emit("room:join", { roomId: roomId }, handleJoinAck);
      }
      if (sock.connected) {
        onConnect();
      }
      sock.on("connect", onConnect);
      sock.on("participant:joined", function (data) {
        if (data.participants) {
          setParticipants(data.participants);
        } else {
          setParticipants(function (prev) {
            var next = Object.assign({}, prev);
            next[data.userId] = {
              name: data.name,
              role: data.role,
              hand: false,
              mic: false,
              camera: false,
              status: "active",
            };
            return next;
          });
        }
      });

      sock.on("participant:left", function (data) {
        if (data.participants) {
          setParticipants(data.participants);
        } else {
          setParticipants(function (prev) {
            var next = Object.assign({}, prev);
            if (next[data.userId]) {
              next[data.userId] = Object.assign({}, next[data.userId], {
                status: "disconnected",
              });
            }
            return next;
          });
        }
      });

      sock.on("participant:removed", function (data) {
        if (data.participants) {
          setParticipants(data.participants);
        } else {
          setParticipants(function (prev) {
            var next = Object.assign({}, prev);
            if (next[data.userId]) {
              next[data.userId] = Object.assign({}, next[data.userId], {
                status: "removed",
              });
            }
            return next;
          });
        }
      });

      sock.on("participant:rejoinAllowed", function (data) {
        if (data.participants) {
          setParticipants(data.participants);
        } else {
          setParticipants(function (prev) {
            var next = Object.assign({}, prev);
            delete next[data.userId];
            return next;
          });
        }
      });

      sock.on("participant:you-were-removed", function () {
        disconnectSocket();
        window.alert("You have been removed from this session by the host.");
        navigate("/dashboard");
      });

      sock.on("waitingRoom:updated", function (list) {
        setWaitingRoomList(list || []);
      });

      sock.on("waitingRoom:approved", function () {
        setIsWaiting(false);
        sock.emit("room:sync", { roomId: roomId }, function (res) {
          if (res && res.ok && res.room) {
            setParticipants(res.room.participants || {});
          }
        });
      });

      sock.on("waitingRoom:rejected", function () {
        disconnectSocket();
        window.alert(
          "Your request to join the session was declined by the host.",
        );
        navigate("/dashboard");
      });

      sock.on("hand:updated", function (data) {
        setParticipants(function (prev) {
          var next = Object.assign({}, prev);
          if (next[data.userId]) {
            next[data.userId] = Object.assign({}, next[data.userId], {
              hand: data.raised,
            });
          }
          return next;
        });
      });

      sock.on("hand:approved", function () {
        window.alert("You were approved to speak!");
      });

      sock.on("hand:dismissed", function () {
        window.alert("Your request to speak was dismissed.");
      });

      sock.on("mic:updated", function (data) {
        setParticipants(function (prev) {
          var next = Object.assign({}, prev);
          if (next[data.userId]) {
            next[data.userId] = Object.assign({}, next[data.userId], {
              mic: data.mic,
              micLocked: data.micLocked,
            });
          }
          return next;
        });
        if (data.userId === userData.email) {
          media.setMicEnabled(data.mic);
        }
      });

      sock.on("mic:allMuted", function (data) {
        if (data.participants) {
          setParticipants(data.participants);
        }
        if (!isTrainer) {
          media.setMicEnabled(false);
        }
      });

      sock.on("mic:mutedByTrainer", function () {
        media.setMicEnabled(false);
      });

      sock.on("mic:unlockAllowed", function (data) {
        if (data.participants) {
          setParticipants(data.participants);
        }
      });

      sock.on("camera:updated", function (data) {
        setParticipants(function (prev) {
          var next = Object.assign({}, prev);
          if (next[data.userId]) {
            next[data.userId] = Object.assign({}, next[data.userId], {
              camera: data.camera,
            });
          }
          return next;
        });
        if (data.userId === userData.email) {
          media.setCameraEnabled(data.camera);
        }
      });

      sock.on("camera:requested", function () {
        if (
          window.confirm(
            "Trainer is asking you to turn on your camera. Accept?",
          )
        ) {
          media.toggleCamera().then(function () {
            sock.emit("camera:toggle", { roomId: roomId });
          });
        }
      });

      sock.on("permissions:updated", function (data) {
        setParticipants(function (prev) {
          var next = Object.assign({}, prev);
          if (next[data.userId]) {
            next[data.userId] = Object.assign({}, next[data.userId], {
              permissions: data.permissions,
            });
          }
          return next;
        });
      });

      sock.on("session:locked", function () {
        setLocked(true);
      });
      sock.on("session:unlocked", function () {
        setLocked(false);
      });
      sock.on("session:waitingRoomToggled", function (data) {
        setWaitingRoomEnabled(data.enabled);
      });
      sock.on("session:ended", function () {
        disconnectSocket();
        navigate("/dashboard");
      });

      timerRef.current = setInterval(function () {
        setElapsed(function (prev) {
          return prev + 1;
        });
      }, 1000);

      return function () {
        sock.off("connect", onConnect);
        sock.off("participant:joined");
        sock.off("participant:left");
        sock.off("participant:removed");
        sock.off("participant:rejoinAllowed");
        sock.off("participant:you-were-removed");
        sock.off("waitingRoom:updated");
        sock.off("waitingRoom:approved");
        sock.off("waitingRoom:rejected");
        sock.off("hand:updated");
        sock.off("hand:approved");
        sock.off("hand:dismissed");
        sock.off("mic:updated");
        sock.off("mic:allMuted");
        sock.off("mic:mutedByTrainer");
        sock.off("mic:unlockAllowed");
        sock.off("camera:updated");
        sock.off("camera:requested");
        sock.off("permissions:updated");
        sock.off("session:locked");
        sock.off("session:unlocked");
        sock.off("session:waitingRoomToggled");
        sock.off("session:ended");
        clearInterval(timerRef.current);
        disconnectSocket();
      };
    },
    [roomId, token, navigate, userData.email, isTrainer],
  );

  var handleLeave = useCallback(
    function () {
      media.cleanupMedia();
      disconnectSocket();
      navigate("/dashboard");
    },
    [navigate, media],
  );

  var handleEndSession = useCallback(
    function () {
      if (!socketRef.current) return;
      socketRef.current.emit("session:end", { roomId: roomId });
    },
    [roomId],
  );

  var handleMicToggle = useCallback(
    async function () {
      if (!socketRef.current) return;
      var me = participants[userData.email];
      if (me && me.micLocked) return;

      await media.toggleMic();
      socketRef.current.emit("mic:toggle", { roomId: roomId });
    },
    [roomId, participants, userData.email, media],
  );

  var handleCameraToggle = useCallback(
    async function () {
      if (!socketRef.current) return;
      await media.toggleCamera();
      socketRef.current.emit("camera:toggle", { roomId: roomId });
    },
    [roomId, media],
  );

  var handleMuteAll = useCallback(
    function () {
      if (!socketRef.current) return;
      socketRef.current.emit("mic:muteAll", { roomId: roomId });
      setMoreMenuOpen(false);
    },
    [roomId],
  );

  var handleLockToggle = useCallback(
    function () {
      if (!socketRef.current) return;
      if (locked) {
        socketRef.current.emit("session:unlock", { roomId: roomId });
      } else {
        socketRef.current.emit("session:lock", { roomId: roomId });
      }
      setMoreMenuOpen(false);
    },
    [locked, roomId],
  );

  var handleWaitingRoomToggle = useCallback(
    function () {
      if (!socketRef.current) return;
      socketRef.current.emit("session:toggleWaitingRoom", {
        roomId: roomId,
        enabled: !waitingRoomEnabled,
      });
      setMoreMenuOpen(false);
    },
    [waitingRoomEnabled, roomId],
  );

  var handleRaiseHandToggle = useCallback(
    function () {
      if (!socketRef.current) return;
      var me = participants[userData.email];
      var isRaised = me && me.hand;
      if (isRaised) {
        socketRef.current.emit("hand:lower");
      } else {
        socketRef.current.emit("hand:raise");
      }
    },
    [participants, userData.email],
  );

  var participantEntries = Object.entries(participants);
  var activeEntries = participantEntries.filter(function (entry) {
    return entry[1].status === "active";
  });
  var activeCount = activeEntries.length;

  var raisedHandsCount = activeEntries.filter(function (entry) {
    return entry[1].hand;
  }).length;

  var myParticipant = participants[userData.email];
  var myHandRaised = myParticipant && myParticipant.hand;
  var myMicLocked = myParticipant && myParticipant.micLocked;

  var canScreenShare = isTrainer;
  if (
    myParticipant &&
    myParticipant.permissions &&
    myParticipant.permissions.canScreenShare !== undefined
  ) {
    canScreenShare = myParticipant.permissions.canScreenShare;
  }

  if (isWaiting) {
    return <WaitingRoom roomId={roomId} onLeave={handleLeave} />;
  }

  return (
    <div className="lcr-root" style={{ flexDirection: "row" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          position: "relative",
        }}
      >
        <NotificationToast />
        <div className="lcr-topbar">
          <div className="lcr-topbar-left">
            <div className="lcr-session-indicator">
              <span className="lcr-live-dot" />
              <span className="lcr-session-name">{roomId}</span>
            </div>
          </div>

          <div className="lcr-topbar-center">
            <span className="lcr-timer">{formatElapsed(elapsed)}</span>
          </div>

          <div className="lcr-topbar-right">
            {locked && (
              <div className="lcr-lock-badge">
                <IconLock /> Locked
              </div>
            )}
            <div className="lcr-participant-count">
              <IconUsers />
              <span>{activeCount}</span>
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flex: 1,
            minHeight: 0,
            flexDirection: "row",
          }}
        >
          {activePanel === "whiteboard" && (
            <div className="lcr-left-panel">
              <Whiteboard id="live-board-1" socketRef={socketRef} />
            </div>
          )}
          <div
            className={
              activePanel === "whiteboard" ? "lcr-right-grid" : "lcr-grid-area"
            }
            style={{ display: "flex", flexDirection: "column" }}
          >
            {(screenShare.localStream || screenShare.remoteStream) && (
              <div className="lcr-screen-share-container">
                <div className="lcr-screen-share-label">
                  {screenShare.sharerName} is sharing their screen
                </div>
                <video
                  className="lcr-screen-share-video"
                  autoPlay
                  playsInline
                  muted={!!screenShare.localStream}
                  ref={(el) => {
                    if (el) {
                      var stream =
                        screenShare.localStream || screenShare.remoteStream;
                      if (el.srcObject !== stream) el.srcObject = stream;
                    }
                  }}
                />
              </div>
            )}
            {activeCount === 0 ? (
              <div className="lcr-empty-state">
                <IconUsers />
                <p>Waiting for participants…</p>
              </div>
            ) : (
              <div className="lcr-video-grid">
                {activeEntries.map(function (entry) {
                  var id = entry[0];
                  var p = entry[1];
                  var initials = (p.name || "?").charAt(0);
                  return (
                    <div className="lcr-video-tile" key={id}>
                      {!p.camera ? (
                        <div className="lcr-tile-avatar">{initials}</div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "100%",
                            height: "100%",
                            background: "#222",
                          }}
                        >
                          {id === userData.email && media.videoStream ? (
                            <video
                              autoPlay
                              playsInline
                              muted
                              ref={function (el) {
                                if (el && el.srcObject !== media.videoStream) {
                                  el.srcObject = media.videoStream;
                                }
                              }}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transform: "scaleX(-1)",
                              }}
                            />
                          ) : (
                            <span style={{ color: "#fff" }}>Video Active</span>
                          )}
                        </div>
                      )}
                      <div className="lcr-tile-label">
                        <span>{p.name || id}</span>
                        {p.role === "Trainer" && (
                          <span className="lcr-tile-role-badge">Host</span>
                        )}
                        {p.hand && (
                          <span
                            style={{
                              marginLeft: "6px",
                              color: "#eab308",
                              display: "flex",
                              width: "14px",
                              height: "14px",
                            }}
                          >
                            <IconHand />
                          </span>
                        )}
                      </div>
                      {!p.mic && (
                        <div className="lcr-tile-mic-off">
                          <IconMicOff />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="lcr-toolbar">
          <div className="lcr-toolbar-group">
            <button
              className={
                "lcr-tb-btn" +
                (!media.micOn ? " off" : "") +
                (myMicLocked ? " locked" : "")
              }
              id="btn-mic"
              title={
                myMicLocked
                  ? "Mic locked by trainer"
                  : media.micOn
                    ? "Mute"
                    : "Unmute"
              }
              onClick={handleMicToggle}
              disabled={!!myMicLocked}
            >
              {media.micOn ? <IconMic /> : <IconMicOff />}
              <span className="lcr-tb-btn-label">
                {myMicLocked ? "Locked" : "Mic"}
              </span>
            </button>
            <button
              className={"lcr-tb-btn" + (!media.cameraOn ? " off" : "")}
              id="btn-camera"
              title={media.cameraOn ? "Stop Video" : "Start Video"}
              onClick={handleCameraToggle}
            >
              {media.cameraOn ? <IconCamera /> : <IconCameraOff />}
              <span className="lcr-tb-btn-label">Camera</span>
            </button>
            {canScreenShare && (
              <button
                className={
                  "lcr-tb-btn" +
                  (screenShare.activeSharerId === userData.email
                    ? " active"
                    : "")
                }
                id="btn-share-screen"
                title={
                  screenShare.activeSharerId === userData.email
                    ? "Stop Sharing"
                    : screenShare.activeSharerId
                      ? (screenShare.sharerName || "Someone else") +
                        " is already sharing"
                      : "Share Screen"
                }
                onClick={() => {
                  if (screenShare.activeSharerId === userData.email) {
                    screenShare.stopScreenShare();
                  } else {
                    screenShare.startScreenShare();
                  }
                }}
                disabled={
                  screenShare.activeSharerId &&
                  screenShare.activeSharerId !== userData.email
                }
                style={{
                  color:
                    screenShare.activeSharerId === userData.email
                      ? "#4ade80"
                      : "inherit",
                }}
              >
                <IconMonitor />
                <span className="lcr-tb-btn-label">Share</span>
              </button>
            )}
          </div>
          <div className="lcr-toolbar-divider" />
          <div className="lcr-toolbar-group">
            {!isTrainer && (
              <button
                className={"lcr-tb-btn" + (myHandRaised ? " active" : "")}
                id="btn-hand"
                title="Raise Hand"
                onClick={handleRaiseHandToggle}
              >
                <IconHand />
                <span className="lcr-tb-btn-label">Hand</span>
              </button>
            )}
            {isTrainer && (
              <button
                className={"lcr-tb-btn" + (handsPanelOpen ? " active" : "")}
                id="btn-hands-panel"
                title="Raised Hands"
                style={{ position: "relative" }}
                onClick={function () {
                  setHandsPanelOpen(function (v) {
                    return !v;
                  });
                  setPanelOpen(false);
                  setWaitingPanelOpen(false);
                  setPermissionsPanelOpen(false);
                  setActivityLogPanelOpen(false);
                }}
              >
                <IconHand />
                <span className="lcr-tb-btn-label">Hands</span>
                {raisedHandsCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      background: "#eab308",
                      color: "#fff",
                      fontSize: "9px",
                      fontWeight: "bold",
                      padding: "2px 5px",
                      borderRadius: "10px",
                      lineHeight: 1,
                    }}
                  >
                    {raisedHandsCount}
                  </span>
                )}
              </button>
            )}
            <button
              className={
                "lcr-tb-btn" +
                (panelOpen &&
                !waitingPanelOpen &&
                !handsPanelOpen &&
                !permissionsPanelOpen &&
                !activityLogPanelOpen
                  ? " active"
                  : "")
              }
              id="btn-participants"
              title="Participants"
              onClick={function () {
                setPanelOpen(function (v) {
                  return !v;
                });
                setWaitingPanelOpen(false);
                setHandsPanelOpen(false);
                setPermissionsPanelOpen(false);
                setActivityLogPanelOpen(false);
              }}
            >
              <IconUsers />
              <span className="lcr-tb-btn-label">People</span>
            </button>
            {isTrainer && (
              <button
                className={"lcr-tb-btn" + (waitingPanelOpen ? " active" : "")}
                id="btn-waiting"
                title="Waiting Room"
                style={{ position: "relative" }}
                onClick={function () {
                  setWaitingPanelOpen(function (v) {
                    return !v;
                  });
                  setPanelOpen(false);
                  setHandsPanelOpen(false);
                  setPermissionsPanelOpen(false);
                  setActivityLogPanelOpen(false);
                }}
              >
                <IconWaiting />
                <span className="lcr-tb-btn-label">Waiting</span>
                {waitingRoomList.length > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: "9px",
                      fontWeight: "bold",
                      padding: "2px 5px",
                      borderRadius: "10px",
                      lineHeight: 1,
                    }}
                  >
                    {waitingRoomList.length}
                  </span>
                )}
              </button>
            )}
            {isTrainer && (
              <button
                className={
                  "lcr-tb-btn" + (permissionsPanelOpen ? " active" : "")
                }
                id="btn-permissions"
                title="Permissions"
                onClick={function () {
                  setPermissionsPanelOpen(function (v) {
                    return !v;
                  });
                  setPanelOpen(false);
                  setHandsPanelOpen(false);
                  setWaitingPanelOpen(false);
                  setActivityLogPanelOpen(false);
                }}
              >
                <IconShield />
                <span className="lcr-tb-btn-label">Perms</span>
              </button>
            )}
            {isTrainer && (
              <button
                className={
                  "lcr-tb-btn" + (activityLogPanelOpen ? " active" : "")
                }
                id="btn-activity"
                title="Activity Log"
                onClick={function () {
                  setActivityLogPanelOpen(function (v) {
                    return !v;
                  });
                  setPermissionsPanelOpen(false);
                  setPanelOpen(false);
                  setHandsPanelOpen(false);
                  setWaitingPanelOpen(false);
                }}
              >
                <IconActivity />
                <span className="lcr-tb-btn-label">Log</span>
              </button>
            )}
            <button
              className={
                "lcr-tb-btn" + (activePanel === "chat" ? " active" : "")
              }
              id="btn-chat"
              title="Chat"
              onClick={function () {
                setActivePanel(function (prev) {
                  return prev === "chat" ? null : "chat";
                });
              }}
            >
              <IconChat />
              <span className="lcr-tb-btn-label">Chat</span>
            </button>
            <button
              className={
                "lcr-tb-btn" + (activePanel === "whiteboard" ? " active" : "")
              }
              id="btn-whiteboard"
              title="Whiteboard"
              onClick={function () {
                setActivePanel(function (prev) {
                  return prev === "whiteboard" ? null : "whiteboard";
                });
              }}
            >
              <IconWhiteboard />
              <span className="lcr-tb-btn-label">Board</span>
            </button>
          </div>

          <div className="lcr-toolbar-divider" />
          <div className="lcr-more-menu-wrapper">
            <button
              className={"lcr-tb-btn" + (moreMenuOpen ? " active" : "")}
              id="btn-more"
              title="More options"
              onClick={function () {
                setMoreMenuOpen(function (v) {
                  return !v;
                });
              }}
            >
              <IconMore />
              <span className="lcr-tb-btn-label">More</span>
            </button>
            {moreMenuOpen && (
              <>
                <div
                  className="lcr-menu-overlay"
                  onClick={function () {
                    setMoreMenuOpen(false);
                  }}
                />
                <div className="lcr-more-menu">
                  {isTrainer && (
                    <>
                      <button
                        className="lcr-more-menu-item"
                        onClick={handleLockToggle}
                      >
                        {locked ? <IconUnlock /> : <IconLock />}
                        <span>
                          {locked ? "Unlock Session" : "Lock Session"}
                        </span>
                      </button>
                      <button
                        className="lcr-more-menu-item"
                        onClick={handleWaitingRoomToggle}
                      >
                        <IconWaiting />
                        <span>
                          {waitingRoomEnabled
                            ? "Disable Waiting Room"
                            : "Enable Waiting Room"}
                        </span>
                      </button>
                      <button
                        className="lcr-more-menu-item"
                        onClick={handleMuteAll}
                      >
                        <IconMicOff />
                        <span>Mute All Students</span>
                      </button>
                      <div className="lcr-menu-divider" />
                      <button
                        className="lcr-more-menu-item danger"
                        onClick={handleEndSession}
                      >
                        <IconEndCall />
                        <span>End Session for All</span>
                      </button>
                    </>
                  )}
                  {!isTrainer && (
                    <button
                      className="lcr-more-menu-item"
                      onClick={handleLeave}
                    >
                      <IconLeave />
                      <span>Leave Session</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          <button
            className="lcr-tb-btn-leave"
            id="btn-leave"
            onClick={handleLeave}
          >
            <IconLeave />
            <span>Leave</span>
          </button>
        </div>
      </div>
      {panelOpen &&
        !waitingPanelOpen &&
        !handsPanelOpen &&
        !permissionsPanelOpen &&
        !activityLogPanelOpen && (
          <ParticipantPanel
            participants={participants}
            isTrainer={isTrainer}
            onClose={function () {
              setPanelOpen(false);
            }}
            socketRef={socketRef}
            roomId={roomId}
          />
        )}
      {waitingPanelOpen && isTrainer && (
        <WaitingRoomPanel
          waitingRoom={waitingRoomList}
          onClose={function () {
            setWaitingPanelOpen(false);
          }}
          socketRef={socketRef}
          roomId={roomId}
        />
      )}
      {handsPanelOpen && isTrainer && (
        <RaisedHandsPanel
          participants={participants}
          onClose={function () {
            setHandsPanelOpen(false);
          }}
          socketRef={socketRef}
          roomId={roomId}
        />
      )}
      {permissionsPanelOpen && isTrainer && (
        <PermissionsPanel
          participants={participants}
          onClose={function () {
            setPermissionsPanelOpen(false);
          }}
          socketRef={socketRef}
          roomId={roomId}
        />
      )}
      {activityLogPanelOpen && isTrainer && (
        <ActivityLog
          roomId={roomId}
          onClose={function () {
            setActivityLogPanelOpen(false);
          }}
        />
      )}
      {activePanel === "chat" && (
        <div className="pp-panel" style={{ padding: 0 }}>
          <div className="pp-header">
            <div className="pp-header-title">
              <span>Chat</span>
            </div>
            <button
              className="pp-close-btn"
              onClick={() => setActivePanel(null)}
              title="Close"
            >
              <IconX />
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <ClassroomChat socket={socketRef.current} />
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveClassroomRoom;

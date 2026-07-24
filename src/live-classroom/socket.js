import { io } from "socket.io-client";
/** @type {import("socket.io-client").Socket | null} */
let socket = null;
let currentRoomId = null;

/**
 * @param {string} roomId
 * @param {string} token
 * @returns {import("socket.io-client").Socket}
 */
export function getSocket(roomId, token) {
  if (socket && socket.connected && currentRoomId === roomId) {
    return socket;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
    currentRoomId = null;
  }

  socket = io("/classroom", {
    auth: { token: token },
    transports: ["websocket", "polling"],
    autoConnect: true,
  });

  currentRoomId = roomId;
  socket.on("connect", function () {
    console.log("[classroom] connected, socketId =", socket.id);
  });

  socket.on("connect_error", function (err) {
    console.error("[classroom] connection error:", err.message);
  });

  socket.on("disconnect", function (reason) {
    console.log("[classroom] disconnected:", reason);
  });
  socket.on("participant:joined", function (data) {
    console.log("[classroom] participant joined:", data.name);
  });

  socket.on("participant:left", function (data) {
    console.log("[classroom] participant left:", data.name);
  });
  socket.on("session:started", function (data) {
    console.log("[classroom] session started:", data.roomId);
  });

  socket.on("session:locked", function (data) {
    console.log("[classroom] session locked:", data.roomId);
  });

  socket.on("session:unlocked", function (data) {
    console.log("[classroom] session unlocked:", data.roomId);
  });

  socket.on("session:ended", function (data) {
    console.log("[classroom] session ended:", data.roomId, "– redirecting…");
  });
  socket.on("participant:removed", function (data) {
    console.log("[classroom] participant removed:", data.userId);
  });

  socket.on("participant:you-were-removed", function (data) {
    console.log("[classroom] you were removed:", data.reason);
  });

  socket.on("participant:rejoinAllowed", function (data) {
    console.log("[classroom] rejoin allowed for:", data.userId);
  });
  socket.on("mic:updated", function (data) {
    console.log(
      "[classroom] mic updated:",
      data.userId,
      "mic=" + data.mic,
      "locked=" + data.micLocked,
    );
  });

  socket.on("mic:allMuted", function () {
    console.log("[classroom] all participants muted");
  });

  socket.on("mic:mutedByTrainer", function () {
    console.log("[classroom] you were muted by the trainer");
  });

  socket.on("mic:unlockAllowed", function (data) {
    console.log("[classroom] mic unlock allowed:", data.targetUserId);
  });

  return socket;
}
export function getCurrentSocket() {
  return socket;
}
export function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentRoomId = null;
  }
}

export function syncRoom(roomId) {
  return new Promise(function (resolve, reject) {
    if (!socket) {
      return reject(new Error("Socket not connected"));
    }
    socket.emit(
      "room:sync",
      { roomId: roomId || currentRoomId },
      function (res) {
        if (res && res.error) {
          reject(new Error(res.error));
        } else {
          resolve(res.room);
        }
      },
    );
  });
}

var jwt = require("jsonwebtoken");
var roomState = require("./roomState.cjs");
var activityLogController = require("../controllers/activityLogController.cjs");
var chatController = require("../controllers/chatController.cjs");
var JWT_SECRET = "aieducation-secret-key";
function isHost(socket) {
  return socket.data.role === "Trainer" || socket.data.role === "Admin";
}
function participantListPayload(roomId) {
  var room = roomState.getRoom(roomId);
  var serialized = roomState.serializeRoom(room);
  return {
    roomId: roomId,
    participants: serialized ? serialized.participants : {},
    activeCount: roomState.activeCount(roomId),
  };
}
/**
 * Attach socket.io to an existing HTTP server.
 * @param {import("http").Server} httpServer
 * @returns {import("socket.io").Server} io
 */
function attachSocket(httpServer) {
  var { Server } = require("socket.io");

  var io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  var classroom = io.of("/classroom");
  classroom.use(function (socket, next) {
    var token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: token missing"));
    }
    try {
      var decoded = jwt.verify(token, JWT_SECRET);
      socket.data.userId = decoded.email;
      socket.data.name = decoded.firstName || "Unknown";
      socket.data.role = decoded.role || "Student";
      next();
    } catch (err) {
      console.error("[classroom] Auth error:", err.message);
      return next(new Error("Authentication error: invalid or expired token"));
    }
  });
  classroom.on("connection", function (socket) {
    console.log(
      "[classroom] participant connected –",
      socket.data.name,
      "(" + socket.data.role + ")",
      "socketId=" + socket.id,
    );
    socket.on("room:join", async function (data, callback) {
      var roomId = data && data.roomId;
      if (!roomId) {
        if (typeof callback === "function") {
          callback({ error: "roomId is required" });
        }
        return;
      }
      var currentStatus = roomState.getParticipantStatus(
        roomId,
        socket.data.userId,
      );
      if (currentStatus === "removed") {
        if (typeof callback === "function") {
          callback({ error: "You have been removed from this session." });
        }
        return;
      }
      socket.data.roomId = roomId;
      var isNew = !roomState.getRoom(roomId);
      var room = roomState.getOrCreateRoom(roomId);
      if (isNew) {
        try {
          var Session = require("../models/Session.cjs");
          var sessionDoc = await Session.findOne({ roomId: roomId });
          if (sessionDoc) {
            room.locked = sessionDoc.locked === true;
            room.waitingRoomEnabled = sessionDoc.waitingRoomEnabled !== false;
          }
        } catch (err) {
          console.error("Error loading session config", err);
        }
      }
      if (roomState.shouldWait(room, socket.data.role, socket.data.userId)) {
        console.log(
          "[classroom] participant placed in waiting room –",
          socket.data.userId,
        );
        roomState.addToWaitingRoom(
          roomId,
          socket.data.userId,
          socket.data.name,
          socket.data.role,
          socket.id,
        );
        classroom
          .to("session:" + roomId + ":hosts")
          .emit("waitingRoom:updated", roomState.getWaitingRoomList(roomId));

        if (typeof callback === "function") {
          callback({
            ok: true,
            waiting: true,
            room: roomState.serializeRoom(room),
          });
        }
        return;
      }
      socket.join("session:" + roomId);
      if (isHost(socket)) {
        socket.join("session:" + roomId + ":hosts");
      }
      roomState.addParticipant(
        roomId,
        socket.data.userId,
        socket.data.name,
        socket.data.role,
        socket.id,
      );
      var payload = participantListPayload(roomId);
      payload.userId = socket.data.userId;
      payload.name = socket.data.name;
      payload.role = socket.data.role;
      classroom.to("session:" + roomId).emit("participant:joined", payload);
      activityLogController.createLog(roomId, "participant:joined", {
        id: socket.data.userId,
        name: socket.data.name,
      });
      if (typeof callback === "function") {
        callback({ ok: true, room: roomState.serializeRoom(room) });
      }
    });
    socket.on("room:sync", function (data, callback) {
      var roomId = (data && data.roomId) || socket.data.roomId;
      if (!roomId) {
        if (typeof callback === "function") {
          callback({ error: "roomId is required" });
        }
        return;
      }
      var room = roomState.getRoom(roomId);
      if (typeof callback === "function") {
        callback({ ok: true, room: roomState.serializeRoom(room) });
      }
    });
    socket.on("session:start", function (data, callback) {
      if (!isHost(socket)) {
        if (typeof callback === "function") {
          callback({ error: "Only Trainer/Admin can start a session" });
        }
        return;
      }
      var roomId = (data && data.roomId) || socket.data.roomId;
      if (!roomId) {
        if (typeof callback === "function") {
          callback({ error: "roomId is required" });
        }
        return;
      }
      var room = roomState.getOrCreateRoom(roomId);
      room.startedAt = new Date();
      classroom.to("session:" + roomId).emit("session:started", {
        roomId: roomId,
        startedAt: room.startedAt,
      });
      if (typeof callback === "function") {
        callback({ ok: true });
      }
    });
    socket.on("session:end", function (data, callback) {
      if (!isHost(socket)) {
        if (typeof callback === "function") {
          callback({ error: "Only Trainer/Admin can end a session" });
        }
        return;
      }
      var roomId = (data && data.roomId) || socket.data.roomId;
      if (!roomId) {
        if (typeof callback === "function") {
          callback({ error: "roomId is required" });
        }
        return;
      }
      classroom
        .to("session:" + roomId)
        .emit("session:ended", { roomId: roomId });
      classroom
        .in("session:" + roomId)
        .fetchSockets()
        .then(function (sockets) {
          for (var i = 0; i < sockets.length; i++) {
            sockets[i].leave("session:" + roomId);
            if (isHost(sockets[i])) {
              sockets[i].leave("session:" + roomId + ":hosts");
            }
            sockets[i].disconnect(true);
          }
        });
      roomState.rooms.delete(roomId);
      console.log("[classroom] session ended –", roomId);
      if (typeof callback === "function") {
        callback({ ok: true });
      }
    });
    socket.on("session:lock", async function (data, callback) {
      if (!isHost(socket)) {
        if (typeof callback === "function") {
          callback({ error: "Only Trainer/Admin can lock a session" });
        }
        return;
      }
      var roomId = (data && data.roomId) || socket.data.roomId;
      if (!roomId) {
        if (typeof callback === "function") {
          callback({ error: "roomId is required" });
        }
        return;
      }
      var room = roomState.getRoom(roomId);
      if (room) {
        room.locked = true;
      }
      try {
        var Session = require("../models/Session.cjs");
        await Session.updateOne({ roomId: roomId }, { locked: true });
      } catch (err) {
        console.error("Error persisting session:lock", err);
      }

      classroom
        .to("session:" + roomId)
        .emit("session:locked", { roomId: roomId });
      console.log("[classroom] session locked –", roomId);
      if (typeof callback === "function") {
        callback({ ok: true });
      }
    });
    socket.on("session:unlock", async function (data, callback) {
      if (!isHost(socket)) {
        if (typeof callback === "function") {
          callback({ error: "Only Trainer/Admin can unlock a session" });
        }
        return;
      }
      var roomId = (data && data.roomId) || socket.data.roomId;
      if (!roomId) {
        if (typeof callback === "function") {
          callback({ error: "roomId is required" });
        }
        return;
      }
      var room = roomState.getRoom(roomId);
      if (room) {
        room.locked = false;
      }
      try {
        var Session = require("../models/Session.cjs");
        await Session.updateOne({ roomId: roomId }, { locked: false });
      } catch (err) {
        console.error("Error persisting session:unlock", err);
      }

      classroom
        .to("session:" + roomId)
        .emit("session:unlocked", { roomId: roomId });
      console.log("[classroom] session unlocked –", roomId);
      if (typeof callback === "function") {
        callback({ ok: true });
      }
    });
    socket.on("session:toggleWaitingRoom", async function (data, callback) {
      if (!isHost(socket)) {
        if (typeof callback === "function") {
          callback({ error: "Only Trainer/Admin can toggle waiting room" });
        }
        return;
      }
      var roomId = (data && data.roomId) || socket.data.roomId;
      var enabled = data && data.enabled;
      if (!roomId) {
        if (typeof callback === "function") {
          callback({ error: "roomId is required" });
        }
        return;
      }
      var room = roomState.getRoom(roomId);
      if (room) {
        room.waitingRoomEnabled = !!enabled;
      }
      try {
        var Session = require("../models/Session.cjs");
        await Session.updateOne(
          { roomId: roomId },
          { waitingRoomEnabled: !!enabled },
        );
      } catch (err) {
        console.error("Error persisting session:toggleWaitingRoom", err);
      }
      classroom
        .to("session:" + roomId)
        .emit("session:waitingRoomToggled", {
          roomId: roomId,
          enabled: !!enabled,
        });
      if (typeof callback === "function") {
        callback({ ok: true });
      }
    });
    socket.on("waitingRoom:approve", function (data, callback) {
      if (!isHost(socket)) {
        if (typeof callback === "function") {
          callback({ error: "Only Trainer/Admin can approve participants" });
        }
        return;
      }
      var roomId = (data && data.roomId) || socket.data.roomId;
      var targetUserId = data && data.targetUserId;
      if (!roomId || !targetUserId) {
        if (typeof callback === "function") {
          callback({ error: "roomId and targetUserId are required" });
        }
        return;
      }
      var entry = roomState.removeFromWaitingRoom(roomId, targetUserId);
      if (entry) {
        if (entry.socketId) {
          classroom
            .to(entry.socketId)
            .emit("waitingRoom:approved", { roomId: roomId });
          classroom
            .in(entry.socketId)
            .fetchSockets()
            .then(function (sockets) {
              for (var i = 0; i < sockets.length; i++) {
                sockets[i].join("session:" + roomId);
              }
            });
        }
        roomState.addParticipant(
          roomId,
          targetUserId,
          entry.name,
          entry.role,
          entry.socketId,
        );
        var payload = participantListPayload(roomId);
        payload.userId = targetUserId;
        payload.name = entry.name;
        payload.role = entry.role;
        classroom.to("session:" + roomId).emit("participant:joined", payload);
        activityLogController.createLog(roomId, "participant:joined", {
          id: targetUserId,
          name: entry.name,
        });
        classroom
          .to("session:" + roomId + ":hosts")
          .emit("waitingRoom:updated", roomState.getWaitingRoomList(roomId));
      }
      if (typeof callback === "function") {
        callback({ ok: true });
      }
    });
    socket.on("waitingRoom:reject", function (data, callback) {
      if (!isHost(socket)) {
        if (typeof callback === "function") {
          callback({ error: "Only Trainer/Admin can reject participants" });
        }
        return;
      }
      var roomId = (data && data.roomId) || socket.data.roomId;
      var targetUserId = data && data.targetUserId;
      if (!roomId || !targetUserId) {
        if (typeof callback === "function") {
          callback({ error: "roomId and targetUserId are required" });
        }
        return;
      }
      var entry = roomState.removeFromWaitingRoom(roomId, targetUserId);
      if (entry) {
        if (entry.socketId) {
          classroom
            .to(entry.socketId)
            .emit("waitingRoom:rejected", { roomId: roomId });
          classroom
            .in(entry.socketId)
            .fetchSockets()
            .then(function (sockets) {
              for (var i = 0; i < sockets.length; i++) {
                sockets[i].disconnect(true);
              }
            });
        }
        classroom
          .to("session:" + roomId + ":hosts")
          .emit("waitingRoom:updated", roomState.getWaitingRoomList(roomId));
      }
      if (typeof callback === "function") {
        callback({ ok: true });
      }
    });
    socket.on("participant:remove", function (data, callback) {
      if (!isHost(socket)) {
        if (typeof callback === "function") {
          callback({ error: "Only Trainer/Admin can remove participants" });
        }
        return;
      }
      var roomId = (data && data.roomId) || socket.data.roomId;
      var targetUserId = data && data.targetUserId;
      if (!roomId || !targetUserId) {
        if (typeof callback === "function") {
          callback({ error: "roomId and targetUserId are required" });
        }
        return;
      }
      var room = roomState.getRoom(roomId);
      var targetParticipant = room && room.participants.get(targetUserId);
      var targetSocketId = targetParticipant && targetParticipant.socketId;
      roomState.markRemoved(roomId, targetUserId);
      if (targetSocketId) {
        classroom.to(targetSocketId).emit("participant:you-were-removed", {
          roomId: roomId,
          reason: "You have been removed from this session by the host.",
        });
      }
      var payload = participantListPayload(roomId);
      payload.userId = targetUserId;
      payload.name = targetParticipant ? targetParticipant.name : targetUserId;
      classroom.to("session:" + roomId).emit("participant:removed", payload);

      activityLogController.createLog(
        roomId,
        "participant:removed",
        { id: socket.data.userId, name: socket.data.name },
        { id: targetUserId, name: payload.name },
      );
      if (targetSocketId) {
        classroom
          .in(targetSocketId)
          .fetchSockets()
          .then(function (sockets) {
            for (var i = 0; i < sockets.length; i++) {
              sockets[i].leave("session:" + roomId);
              sockets[i].disconnect(true);
            }
          });
      }
      console.log(
        "[classroom] participant removed –",
        targetUserId,
        "from",
        roomId,
      );
      if (typeof callback === "function") {
        callback({ ok: true });
      }
    });
    socket.on("participant:allowRejoin", function (data, callback) {
      if (!isHost(socket)) {
        if (typeof callback === "function") {
          callback({ error: "Only Trainer/Admin can allow rejoin" });
        }
        return;
      }
      var roomId = (data && data.roomId) || socket.data.roomId;
      var targetUserId = data && data.targetUserId;
      if (!roomId || !targetUserId) {
        if (typeof callback === "function") {
          callback({ error: "roomId and targetUserId are required" });
        }
        return;
      }
      var result = roomState.allowRejoin(roomId, targetUserId);
      if (!result) {
        if (typeof callback === "function") {
          callback({ error: "User is not in 'removed' status or not found" });
        }
        return;
      }
      var payload = participantListPayload(roomId);
      payload.userId = targetUserId;
      classroom
        .to("session:" + roomId)
        .emit("participant:rejoinAllowed", payload);

      console.log("[classroom] rejoin allowed –", targetUserId, "in", roomId);
      if (typeof callback === "function") {
        callback({ ok: true });
      }
    });
    socket.on("chat:send", function (data, callback) {
      var roomId = (data && data.roomId) || socket.data.roomId;
      var message = data && data.message;
      var messageType = (data && data.messageType) || "Text";
      var userId = socket.data.userId;
      var userName = socket.data.name;
      if (!roomId || !message) {
        if (typeof callback === "function")
          callback({ ok: false, error: "Missing roomId or message" });
        return;
      }
      var perms = roomState.getPermissions(roomId, userId);
      if (perms && perms.canChat === false) {
        if (typeof callback === "function")
          callback({
            ok: false,
            error: "Chat has been disabled for you by the trainer.",
          });
        return;
      }
      chatController
        .saveMessage(roomId, userId, userName, message, messageType)
        .then(function (savedMessage) {
          classroom.to("session:" + roomId).emit("chat:message", savedMessage);
          if (typeof callback === "function")
            callback({ ok: true, data: savedMessage });
        })
        .catch(function (err) {
          if (typeof callback === "function")
            callback({
              ok: false,
              error: err.message || "Failed to save message",
            });
        });
    });
    socket.on("screenShare:start", function (data, callback) {
      var roomId = (data && data.roomId) || socket.data.roomId;
      var userId = socket.data.userId;
      if (!roomId) return;
      var perms = roomState.getPermissions(roomId, userId);
      if (perms && perms.canScreenShare === false) {
        socket.emit("screenShare:error", {
          reason: "Screen sharing permission denied.",
        });
        if (typeof callback === "function")
          callback({ ok: false, error: "Screen sharing permission denied." });
        return;
      }
      var room = roomState.getRoom(roomId);
      if (!room) {
        socket.emit("screenShare:error", { reason: "Room not found." });
        if (typeof callback === "function")
          callback({ ok: false, error: "Room not found." });
        return;
      }
      if (room.activeScreenSharer && room.activeScreenSharer !== userId) {
        socket.emit("screenShare:error", {
          reason: "Someone else is already sharing their screen.",
        });
        if (typeof callback === "function")
          callback({
            ok: false,
            error: "Someone else is already sharing their screen.",
          });
        return;
      }
      room.activeScreenSharer = userId;
      classroom.to("session:" + roomId).emit("screenShare:started", {
        roomId: roomId,
        userId: userId,
        name: socket.data.name,
      });

      if (typeof callback === "function") callback({ ok: true });
    });
    socket.on("screenShare:stop", function (data, callback) {
      var roomId = (data && data.roomId) || socket.data.roomId;
      var userId = socket.data.userId;
      if (!roomId) return;
      var room = roomState.getRoom(roomId);
      if (room && room.activeScreenSharer === userId) {
        room.activeScreenSharer = null;
        classroom.to("session:" + roomId).emit("screenShare:stopped", {
          roomId: roomId,
          userId: userId,
        });
      }

      if (typeof callback === "function") callback({ ok: true });
    });
    socket.on("webrtc:screen:offer", function (data) {
      var roomId = (data && data.roomId) || socket.data.roomId;
      var targetUserId = data && data.targetUserId;
      if (!roomId || !targetUserId) return;
      var room = roomState.getRoom(roomId);
      if (room) {
        var targetParticipant = room.participants.get(targetUserId);
        if (targetParticipant && targetParticipant.socketId) {
          classroom.to(targetParticipant.socketId).emit("webrtc:screen:offer", {
            roomId: roomId,
            senderId: socket.data.userId,
            sdp: data.sdp,
          });
        }
      }
    });
    socket.on("webrtc:screen:answer", function (data) {
      var roomId = (data && data.roomId) || socket.data.roomId;
      var targetUserId = data && data.targetUserId;
      if (!roomId || !targetUserId) return;
      var room = roomState.getRoom(roomId);
      if (room) {
        var targetParticipant = room.participants.get(targetUserId);
        if (targetParticipant && targetParticipant.socketId) {
          classroom
            .to(targetParticipant.socketId)
            .emit("webrtc:screen:answer", {
              roomId: roomId,
              senderId: socket.data.userId,
              sdp: data.sdp,
            });
        }
      }
    });
    socket.on("webrtc:screen:ice-candidate", function (data) {
      var roomId = (data && data.roomId) || socket.data.roomId;
      var targetUserId = data && data.targetUserId;
      if (!roomId || !targetUserId) return;
      var room = roomState.getRoom(roomId);
      if (room) {
        var targetParticipant = room.participants.get(targetUserId);
        if (targetParticipant && targetParticipant.socketId) {
          classroom
            .to(targetParticipant.socketId)
            .emit("webrtc:screen:ice-candidate", {
              roomId: roomId,
              senderId: socket.data.userId,
              candidate: data.candidate,
            });
        }
      }
    });
    socket.on("hand:raise", function (data, callback) {
      var roomId = (data && data.roomId) || socket.data.roomId;
      if (!roomId) return;
      var userId = socket.data.userId;
      var perms = roomState.getPermissions(roomId, userId);
      if (perms && perms.canSpeak === false) {
        socket.emit("hand:denied", {
          reason: "speaking permission revoked by trainer",
        });
        if (typeof callback === "function")
          callback({
            ok: false,
            reason: "speaking permission revoked by trainer",
          });
        return;
      }

      var result = roomState.setHand(roomId, userId, true);
      if (result) {
        classroom.to("session:" + roomId).emit("hand:updated", {
          roomId: roomId,
          userId: userId,
          raised: true,
        });
        activityLogController.createLog(roomId, "hand:raise", {
          id: userId,
          name: socket.data.name,
        });
      }
      if (typeof callback === "function") callback({ ok: true });
    });
    socket.on("hand:lower", function (data, callback) {
      var roomId = (data && data.roomId) || socket.data.roomId;
      if (!roomId) return;
      var userId = socket.data.userId;

      var result = roomState.setHand(roomId, userId, false);
      if (result) {
        classroom.to("session:" + roomId).emit("hand:updated", {
          roomId: roomId,
          userId: userId,
          raised: false,
        });
        activityLogController.createLog(roomId, "hand:lower", {
          id: userId,
          name: socket.data.name,
        });
      }
      if (typeof callback === "function") callback({ ok: true });
    });
    socket.on("hand:approve", function (data, callback) {
      if (!isHost(socket)) return;
      var roomId = (data && data.roomId) || socket.data.roomId;
      var targetUserId = data && data.targetUserId;
      if (!roomId || !targetUserId) return;

      var result = roomState.setHand(roomId, targetUserId, false);
      if (result) {
        classroom.to("session:" + roomId).emit("hand:updated", {
          roomId: roomId,
          userId: targetUserId,
          raised: false,
        });
        var room = roomState.getRoom(roomId);
        var p = room && room.participants.get(targetUserId);
        if (p && p.socketId) {
          classroom.to(p.socketId).emit("hand:approved", { roomId: roomId });
        }
      }
      if (typeof callback === "function") callback({ ok: true });
    });
    socket.on("hand:dismiss", function (data, callback) {
      if (!isHost(socket)) return;
      var roomId = (data && data.roomId) || socket.data.roomId;
      var targetUserId = data && data.targetUserId;
      if (!roomId || !targetUserId) return;
      var result = roomState.setHand(roomId, targetUserId, false);
      if (result) {
        classroom.to("session:" + roomId).emit("hand:updated", {
          roomId: roomId,
          userId: targetUserId,
          raised: false,
        });
        var room = roomState.getRoom(roomId);
        var p = room && room.participants.get(targetUserId);
        if (p && p.socketId) {
          classroom.to(p.socketId).emit("hand:dismissed", { roomId: roomId });
        }
      }
      if (typeof callback === "function") callback({ ok: true });
    });
    socket.on("mic:toggle", function (data, callback) {
      var roomId = (data && data.roomId) || socket.data.roomId;
      if (!roomId) return;
      var userId = socket.data.userId;
      var room = roomState.getRoom(roomId);
      if (!room) return;
      var p = room.participants.get(userId);
      if (!p) return;
      var newState = !p.mic;
      var result = roomState.setMic(roomId, userId, newState);
      if (!result) {
        if (typeof callback === "function")
          callback({ ok: false, error: "Mic is locked by trainer" });
        return;
      }
      classroom.to("session:" + roomId).emit("mic:updated", {
        roomId: roomId,
        userId: userId,
        mic: newState,
        micLocked: p.micLocked,
      });
      activityLogController.createLog(
        roomId,
        "mic:toggle",
        { id: userId, name: socket.data.name },
        null,
        { mic: newState },
      );
      if (typeof callback === "function") callback({ ok: true, mic: newState });
    });
    socket.on("mic:muteOne", function (data, callback) {
      if (!isHost(socket)) return;
      var roomId = (data && data.roomId) || socket.data.roomId;
      var targetUserId = data && data.targetUserId;
      if (!roomId || !targetUserId) return;
      roomState.setMicLocked(roomId, targetUserId, true);
      classroom.to("session:" + roomId).emit("mic:updated", {
        roomId: roomId,
        userId: targetUserId,
        mic: false,
        micLocked: true,
      });
      var targetParticipant = roomState
        .getRoom(roomId)
        .participants.get(targetUserId);
      activityLogController.createLog(
        roomId,
        "mic:muteOne",
        { id: socket.data.userId, name: socket.data.name },
        {
          id: targetUserId,
          name: targetParticipant ? targetParticipant.name : targetUserId,
        },
      );
      var room = roomState.getRoom(roomId);
      var p = room && room.participants.get(targetUserId);
      if (p && p.socketId) {
        classroom.to(p.socketId).emit("mic:mutedByTrainer", { roomId: roomId });
      }
      if (typeof callback === "function") callback({ ok: true });
    });
    socket.on("mic:muteAll", function (data, callback) {
      if (!isHost(socket)) return;
      var roomId = (data && data.roomId) || socket.data.roomId;
      if (!roomId) return;
      var affected = roomState.muteAllExceptHost(roomId);
      var room = roomState.getRoom(roomId);
      var serialized = roomState.serializeRoom(room);
      classroom.to("session:" + roomId).emit("mic:allMuted", {
        roomId: roomId,
        participants: serialized ? serialized.participants : {},
      });
      activityLogController.createLog(
        roomId,
        "mic:muteAll",
        { id: socket.data.userId, name: socket.data.name },
        null,
        { affectedCount: affected },
      );
      if (room) {
        affected.forEach(function (uid) {
          var p = room.participants.get(uid);
          if (p && p.socketId) {
            classroom
              .to(p.socketId)
              .emit("mic:mutedByTrainer", { roomId: roomId });
          }
        });
      }
      if (typeof callback === "function") callback({ ok: true });
    });
    socket.on("mic:allowUnmute", function (data, callback) {
      if (!isHost(socket)) return;
      var roomId = (data && data.roomId) || socket.data.roomId;
      var targetUserId = data && data.targetUserId;
      if (!roomId || !targetUserId) return;
      roomState.allowUnmute(roomId, targetUserId);
      var room = roomState.getRoom(roomId);
      var serialized = roomState.serializeRoom(room);
      classroom.to("session:" + roomId).emit("mic:unlockAllowed", {
        roomId: roomId,
        targetUserId: targetUserId,
        participants: serialized ? serialized.participants : {},
      });
      if (typeof callback === "function") callback({ ok: true });
    });
    socket.on("camera:toggle", function (data, callback) {
      var roomId = (data && data.roomId) || socket.data.roomId;
      if (!roomId) return;
      var userId = socket.data.userId;
      var room = roomState.getRoom(roomId);
      if (!room) return;
      var p = room.participants.get(userId);
      if (!p) return;
      var newState = !p.camera;
      roomState.setCamera(roomId, userId, newState);
      classroom.to("session:" + roomId).emit("camera:updated", {
        roomId: roomId,
        userId: userId,
        camera: newState,
      });
      activityLogController.createLog(
        roomId,
        "camera:toggle",
        { id: userId, name: socket.data.name },
        null,
        { camera: newState },
      );
      if (typeof callback === "function")
        callback({ ok: true, camera: newState });
    });
    socket.on("camera:request", function (data, callback) {
      if (!isHost(socket)) return;
      var roomId = (data && data.roomId) || socket.data.roomId;
      var targetUserId = data && data.targetUserId;
      if (!roomId || !targetUserId) return;
      var room = roomState.getRoom(roomId);
      var p = room && room.participants.get(targetUserId);
      if (p && p.socketId) {
        classroom.to(p.socketId).emit("camera:requested", { roomId: roomId });
      }
      if (typeof callback === "function") callback({ ok: true });
    });
    socket.on("permissions:update", function (data, callback) {
      if (!isHost(socket)) return;
      var roomId = (data && data.roomId) || socket.data.roomId;
      var targetUserId = data && data.targetUserId;
      var updates = data && data.updates;
      if (!roomId || !targetUserId || !updates) return;
      console.log("[classroom] permissions:update received:", {
        targetUserId: targetUserId,
        updates: updates,
      });
      var newPerms = roomState.updatePermissions(roomId, targetUserId, updates);
      if (newPerms) {
        classroom.to("session:" + roomId).emit("permissions:updated", {
          roomId: roomId,
          userId: targetUserId,
          permissions: newPerms,
        });
        var room = roomState.getRoom(roomId);
        var p = room && room.participants.get(targetUserId);
        if (p && p.socketId) {
          classroom.to(p.socketId).emit("permissions:updated", {
            roomId: roomId,
            userId: targetUserId,
            permissions: newPerms,
          });
        }
      }
      if (typeof callback === "function") callback({ ok: true });
    });
    socket.on("whiteboard:stroke", function (data, callback) {
      var roomId = socket.data.roomId;
      if (!roomId) return;
      socket.to("session:" + roomId).emit("whiteboard:stroke", data);
      try {
        var Whiteboard = require("../models/Whiteboard.cjs");
        var newDrawing = new Whiteboard({
          sessionId: roomId,
          userId: socket.data.userId,
          drawingData: data,
          toolType: data.tool || "Pen",
          color: data.color,
          strokeWidth: data.strokeWidth,
          timestamp: new Date(),
        });
        newDrawing
          .save()
          .catch((err) =>
            console.error("Error saving stroke via socket:", err),
          );
      } catch (err) {
        console.error("Error setting up stroke persistence:", err);
      }
      if (typeof callback === "function") callback({ ok: true });
    });
    socket.on("whiteboard:sticky", function (data, callback) {
      var roomId = socket.data.roomId;
      if (!roomId) return;
      socket.to("session:" + roomId).emit("whiteboard:sticky", data);
      try {
        var StickyNote = require("../models/StickyNote.cjs");
        if (data.action === "add" && data.sticky) {
          var newNote = new StickyNote({
            sessionId: roomId,
            userId: socket.data.userId,
            noteId: String(data.sticky.id || data.sticky.noteId),
            x: data.sticky.x,
            y: data.sticky.y,
            text: data.sticky.text,
            color: data.sticky.color,
          });
          newNote
            .save()
            .catch((err) =>
              console.error("Error saving sticky via socket:", err),
            );
        } else if (data.action === "update" && data.sticky) {
          var noteIdStr = String(data.sticky.id || data.sticky.noteId);
          StickyNote.findOneAndUpdate(
            { noteId: noteIdStr },
            {
              text: data.sticky.text,
              color: data.sticky.color,
              x: data.sticky.x,
              y: data.sticky.y,
            },
          ).catch((err) =>
            console.error("Error updating sticky via socket:", err),
          );
        } else if (data.action === "remove" && data.noteId) {
          StickyNote.findOneAndDelete({ noteId: String(data.noteId) }).catch(
            (err) => console.error("Error deleting sticky via socket:", err),
          );
        }
      } catch (err) {
        console.error("Error setting up sticky persistence:", err);
      }
      if (typeof callback === "function") callback({ ok: true });
    });
    socket.on("screenShare:start", function (data, callback) {
      var roomId = (data && data.roomId) || socket.data.roomId;
      var userId = socket.data.userId;
      if (!roomId) return;
      var perms = roomState.getPermissions(roomId, userId);
      if (perms && perms.canScreenShare === false) {
        socket.emit("screenShare:denied", {
          reason: "Screen sharing disabled by trainer",
        });
        if (typeof callback === "function")
          callback({ ok: false, error: "Screen sharing disabled" });
        return;
      }
      if (typeof callback === "function") callback({ ok: true });
    });
    socket.on("disconnect", function () {
      console.log(
        "[classroom] participant disconnected –",
        socket.data.name,
        "(" + socket.data.role + ")",
        "socketId=" + socket.id,
      );
      var roomId = socket.data.roomId;
      if (roomId) {
        var removedFromWait = roomState.removeFromWaitingRoom(
          roomId,
          socket.data.userId,
        );
        if (removedFromWait) {
          classroom
            .to("session:" + roomId + ":hosts")
            .emit("waitingRoom:updated", roomState.getWaitingRoomList(roomId));
        }
        var room = roomState.getRoom(roomId);
        if (room && room.activeScreenSharer === socket.data.userId) {
          room.activeScreenSharer = null;
          classroom.to("session:" + roomId).emit("screenShare:stopped", {
            roomId: roomId,
            userId: socket.data.userId,
          });
        }
        var status = roomState.getParticipantStatus(roomId, socket.data.userId);
        if (status) {
          roomState.markDisconnected(
            roomId,
            socket.data.userId,
            function (rid, uid) {
              console.log(
                "[classroom] grace expired – removing",
                uid,
                "from",
                rid,
              );
              var payload = participantListPayload(rid);
              payload.userId = uid;
              classroom
                .to("session:" + rid)
                .emit("participant:removed", payload);
            },
          );
          var payload = participantListPayload(roomId);
          payload.userId = socket.data.userId;
          payload.name = socket.data.name;
          classroom.to("session:" + roomId).emit("participant:left", payload);
          activityLogController.createLog(roomId, "participant:left", {
            id: socket.data.userId,
            name: socket.data.name,
          });
        }
      }
    });
  });

  return io;
}

module.exports = attachSocket;

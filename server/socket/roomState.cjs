var rooms = new Map();
var disconnectTimers = new Map();
var RECONNECT_GRACE_MS = 30000;
function defaultPermissions(role) {
  if (role === "Trainer" || role === "Admin") {
    return {
      canSpeak: true,
      canChat: true,
      canScreenShare: true,
      whiteboard: true,
    };
  }
  return {
    canSpeak: true,
    canChat: true,
    canScreenShare: false,
    whiteboard: false,
  };
}
function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      participants: new Map(),
      locked: false,
      waitingRoomEnabled: true,
      startedAt: new Date(),
      waitingRoom: [],
      activeScreenSharer: null,
    });
  }
  return rooms.get(roomId);
}
function getRoom(roomId) {
  return rooms.get(roomId) || null;
}
function shouldWait(room, role, userId) {
  if (role === "Trainer" || role === "Admin") return false;
  if (userId) {
    var p = room.participants.get(userId);
    if (p && p.status !== "removed") {
      return false;
    }
  }
  if (room.locked) return true;
  if (room.waitingRoomEnabled) return true;
  return false;
}
function addToWaitingRoom(roomId, userId, name, role, socketId) {
  var room = getOrCreateRoom(roomId);
  for (var i = 0; i < room.waitingRoom.length; i++) {
    if (room.waitingRoom[i].userId === userId) {
      room.waitingRoom[i].socketId = socketId;
      room.waitingRoom[i].name = name;
      return room;
    }
  }
  room.waitingRoom.push({
    userId: userId,
    name: name,
    role: role,
    socketId: socketId,
  });
  return room;
}
function removeFromWaitingRoom(roomId, userId) {
  var room = rooms.get(roomId);
  if (!room) return null;
  var idx = -1;
  for (var i = 0; i < room.waitingRoom.length; i++) {
    if (room.waitingRoom[i].userId === userId) {
      idx = i;
      break;
    }
  }
  if (idx === -1) return null;
  var entry = room.waitingRoom[idx];
  room.waitingRoom.splice(idx, 1);
  return entry;
}
function getWaitingRoomList(roomId) {
  var room = rooms.get(roomId);
  if (!room) return [];
  return room.waitingRoom.map(function (entry) {
    return {
      userId: entry.userId,
      name: entry.name,
      role: entry.role,
    };
  });
}
function addParticipant(roomId, userId, name, role, socketId) {
  var room = getOrCreateRoom(roomId);
  var timerKey = roomId + ":" + userId;
  if (disconnectTimers.has(timerKey)) {
    clearTimeout(disconnectTimers.get(timerKey));
    disconnectTimers.delete(timerKey);
  }
  var existing = room.participants.get(userId);
  if (existing) {
    existing.socketId = socketId;
    existing.status = "active";
    existing.name = name;
    return room;
  }

  room.participants.set(userId, {
    name: name,
    role: role,
    socketId: socketId,
    hand: false,
    raisedAt: null,
    mic: false,
    micLocked: false,
    camera: false,
    status: "active",
    permissions: defaultPermissions(role),
  });
  return room;
}
function markDisconnected(roomId, userId, onGraceExpired) {
  var room = rooms.get(roomId);
  if (!room) return;
  var participant = room.participants.get(userId);
  if (!participant || participant.status === "removed") return;

  participant.status = "disconnected";
  participant.socketId = null;

  var timerKey = roomId + ":" + userId;
  if (disconnectTimers.has(timerKey)) {
    clearTimeout(disconnectTimers.get(timerKey));
  }

  var timerId = setTimeout(function () {
    disconnectTimers.delete(timerKey);
    var r = rooms.get(roomId);
    if (!r) return;
    var p = r.participants.get(userId);
    if (p && p.status === "disconnected") {
      p.status = "removed";
      if (typeof onGraceExpired === "function") {
        onGraceExpired(roomId, userId);
      }
    }
  }, RECONNECT_GRACE_MS);

  disconnectTimers.set(timerKey, timerId);
}
function markRemoved(roomId, userId) {
  var room = rooms.get(roomId);
  if (!room) return;
  var participant = room.participants.get(userId);
  if (!participant) return;

  participant.status = "removed";
  participant.socketId = null;

  var timerKey = roomId + ":" + userId;
  if (disconnectTimers.has(timerKey)) {
    clearTimeout(disconnectTimers.get(timerKey));
    disconnectTimers.delete(timerKey);
  }
}
function getParticipantStatus(roomId, userId) {
  var room = rooms.get(roomId);
  if (!room) return null;
  var participant = room.participants.get(userId);
  if (!participant) return null;
  return participant.status;
}
function allowRejoin(roomId, userId) {
  var room = rooms.get(roomId);
  if (!room) return false;
  var participant = room.participants.get(userId);
  if (!participant) return false;
  if (participant.status === "removed") {
    room.participants.delete(userId);
    return true;
  }
  return false;
}
function removeParticipant(roomId, userId) {
  var room = rooms.get(roomId);
  if (!room) return true;
  room.participants.delete(userId);

  var timerKey = roomId + ":" + userId;
  if (disconnectTimers.has(timerKey)) {
    clearTimeout(disconnectTimers.get(timerKey));
    disconnectTimers.delete(timerKey);
  }

  if (room.participants.size === 0) {
    rooms.delete(roomId);
    return true;
  }
  return false;
}
function activeCount(roomId) {
  var room = rooms.get(roomId);
  if (!room) return 0;
  var count = 0;
  room.participants.forEach(function (p) {
    if (p.status === "active") count++;
  });
  return count;
}
function serializeRoom(room) {
  if (!room) return null;
  var participantsObj = {};
  room.participants.forEach(function (value, key) {
    participantsObj[key] = value;
  });
  return {
    participants: participantsObj,
    locked: room.locked,
    waitingRoomEnabled: room.waitingRoomEnabled,
    startedAt: room.startedAt,
    waitingRoom: room.waitingRoom.map(function (e) {
      return { userId: e.userId, name: e.name, role: e.role };
    }),
  };
}
function setHand(roomId, userId, raised) {
  var room = rooms.get(roomId);
  if (!room) return false;
  var participant = room.participants.get(userId);
  if (!participant) return false;

  participant.hand = !!raised;
  participant.raisedAt = raised ? new Date() : null;
  return true;
}
function setCamera(roomId, userId, on) {
  var room = rooms.get(roomId);
  if (!room) return false;
  var participant = room.participants.get(userId);
  if (!participant) return false;
  participant.camera = !!on;
  return true;
}
function setMic(roomId, userId, on) {
  var room = rooms.get(roomId);
  if (!room) return false;
  var participant = room.participants.get(userId);
  if (!participant) return false;
  if (on && participant.micLocked) return false;
  participant.mic = !!on;
  return true;
}
function setMicLocked(roomId, userId, locked) {
  var room = rooms.get(roomId);
  if (!room) return false;
  var participant = room.participants.get(userId);
  if (!participant) return false;
  participant.micLocked = !!locked;
  if (locked) participant.mic = false;
  return true;
}
function muteAllExceptHost(roomId) {
  var room = rooms.get(roomId);
  if (!room) return [];
  var affected = [];
  room.participants.forEach(function (p, uid) {
    if (p.role !== "Trainer" && p.role !== "Admin" && p.status === "active") {
      p.mic = false;
      p.micLocked = true;
      affected.push(uid);
    }
  });
  return affected;
}
function allowUnmute(roomId, userId) {
  var room = rooms.get(roomId);
  if (!room) return [];
  var affected = [];
  if (userId === "all") {
    room.participants.forEach(function (p, uid) {
      if (p.micLocked) {
        p.micLocked = false;
        affected.push(uid);
      }
    });
  } else {
    var p = room.participants.get(userId);
    if (p && p.micLocked) {
      p.micLocked = false;
      affected.push(userId);
    }
  }
  return affected;
}
function updatePermissions(roomId, userId, updates) {
  var room = rooms.get(roomId);
  if (!room) return false;
  var participant = room.participants.get(userId);
  if (!participant) return false;
  participant.permissions = Object.assign({}, participant.permissions, updates);
  return participant.permissions;
}
function getPermissions(roomId, userId) {
  var room = rooms.get(roomId);
  if (!room) return null;
  var participant = room.participants.get(userId);
  if (!participant) return null;
  return participant.permissions;
}

module.exports = {
  rooms: rooms,
  getOrCreateRoom: getOrCreateRoom,
  getRoom: getRoom,
  shouldWait: shouldWait,
  addToWaitingRoom: addToWaitingRoom,
  removeFromWaitingRoom: removeFromWaitingRoom,
  getWaitingRoomList: getWaitingRoomList,
  addParticipant: addParticipant,
  markDisconnected: markDisconnected,
  markRemoved: markRemoved,
  getParticipantStatus: getParticipantStatus,
  allowRejoin: allowRejoin,
  removeParticipant: removeParticipant,
  activeCount: activeCount,
  serializeRoom: serializeRoom,
  setHand: setHand,
  setCamera: setCamera,
  setMic: setMic,
  setMicLocked: setMicLocked,
  muteAllExceptHost: muteAllExceptHost,
  allowUnmute: allowUnmute,
  updatePermissions: updatePermissions,
  getPermissions: getPermissions,
};

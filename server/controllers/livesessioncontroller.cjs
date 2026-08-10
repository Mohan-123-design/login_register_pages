var Session = require("../models/Session.cjs");
var Attendance = require("../models/Attendance.cjs");
var Batch = require("../models/batch.cjs");
var attendanceHelper = require("./attendanceHelper.cjs");
var activityLogController = require("./activityLogController.cjs");
var roomState = require("../socket/roomState.cjs");

function buildLiveInfo(roomId) {
  var room = roomState.getRoom(roomId);
  if (!room) {
    return null;
  }
  var totalParticipants = 0;
  var activeParticipants = 0;
  var participants = [];
  room.participants.forEach(function (p, userId) {
    if (p.status === "removed") return;
    totalParticipants += 1;
    if (p.status === "active") activeParticipants += 1;
    participants.push({
      userId: userId,
      name: p.name,
      role: p.role,
      status: p.status,
      mic: p.mic,
      camera: p.camera,
      hand: p.hand,
    });
  });
var startedAt = room.startedAt || null;
  var durationSeconds = startedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
    : 0;
  var elapsedMinutes = Math.round(durationSeconds / 60);
  var waitingRoomCount = room.waitingRoom ? room.waitingRoom.length : 0;

  return {
    onServer: true,
    isLive: true,
    startedAt: startedAt,
    elapsedMinutes: elapsedMinutes,
    durationSeconds: durationSeconds,
    totalParticipants: totalParticipants,
    totalJoined: totalParticipants,
    activeParticipants: activeParticipants,
    locked: room.locked,
    waitingRoomEnabled: room.waitingRoomEnabled,
    waitingRoomCount: waitingRoomCount,
    waitingCount: waitingRoomCount,
    participants: participants,
  };
}
async function buildIntegrityInfo(session) {
  var batchName = session.batch || session.name;
  var info = {
    batchFound: false,
    batchCode: "",
    courseName: "",
    assignedTrainerName: "",
    trainerMismatch: false,
    warnings: [],
  };

  if (!batchName) {
    info.warnings.push("Session has no batch/name reference to verify.");
    return info;
  }

  try {
    var batchDoc = await Batch.findOne({ name: batchName });
    if (!batchDoc) {
      info.warnings.push(
        'No matching batch record found for "' + batchName + '".',
      );
      return info;
    }
    info.batchFound = true;
    info.batchCode = batchDoc.code || "";
    info.courseName = batchDoc.courseName || "";
    info.assignedTrainerName = batchDoc.trainerName || "";

    if (
      batchDoc.trainerName &&
      session.trainer &&
      batchDoc.trainerName.trim().toLowerCase() !==
        session.trainer.trim().toLowerCase()
    ) {
      info.trainerMismatch = true;
      info.warnings.push(
        'Session trainer "' +
          session.trainer +
          '" does not match the trainer assigned to this batch ("' +
          batchDoc.trainerName +
          '").',
      );
    }
    if (!batchDoc.courseName) {
      info.warnings.push("Batch has no course linked to it.");
    }
  } catch (err) {
    console.error("[liveSessionController] Error verifying batch link:", err);
    info.warnings.push("Could not verify batch/course link (server error).");
  }

  return info;
}

var liveSessionController = {
  getLiveSessions: async function (req, res) {
    try {
      var statusFilter = req.query.status || "Live";
      var query = {};
      if (statusFilter !== "All") {
        query.status = statusFilter;
      }

      var sessions = await Session.find(query).sort({ createdAt: -1 });

      var results = await Promise.all(
        sessions.map(async function (session) {
          var liveInfo = buildLiveInfo(session.roomId);
          var integrity = await buildIntegrityInfo(session);
          return {
            roomId: session.roomId,
            name: session.name,
            batch: session.batch || session.name,
            trainer: session.trainer,
            date: session.date,
            time: session.time,
            duration: session.duration,
            status: session.status,
            locked: session.locked,
            waitingRoomEnabled: session.waitingRoomEnabled,
            live: liveInfo, 
            integrity: integrity,
          };
        }),
      );

      return res.status(200).json({ success: true, sessions: results });
    } catch (error) {
      console.error("[liveSessionController] getLiveSessions error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  getSessionStatistics: async function (req, res) {
    try {
      var roomId = req.params.roomId;
      var session = await Session.findOne({ roomId: roomId });
      if (!session) {
        return res
          .status(404)
          .json({ success: false, message: "Session not found." });
      }

      var liveInfo = buildLiveInfo(roomId);

      var attendanceRecords = await Attendance.find({ sessionId: roomId });
      var attendanceStats = attendanceHelper.calculateReportData(
        attendanceRecords,
      );
return res.status(200).json({
        success: true,
        roomId: roomId,
        status: session.status,
        scheduledDate: session.date,
        scheduledTime: session.time,
        plannedDurationMinutes: session.duration,
        live: liveInfo,
        stats: {
          status: session.status,
          isLive: !!liveInfo,
          activeParticipants: liveInfo ? liveInfo.activeParticipants : 0,
          totalJoined: liveInfo ? liveInfo.totalJoined : 0,
          waitingCount: liveInfo ? liveInfo.waitingCount : 0,
          durationSeconds: liveInfo ? liveInfo.durationSeconds : 0,
          participants: liveInfo ? liveInfo.participants : [],
        },
        attendance: {
          totalRecords: attendanceStats.totalRecords,
          present: attendanceStats.present,
          absent: attendanceStats.absent,
          late: attendanceStats.late,
          attendancePercentage: attendanceStats.attendancePercentage,
          totalDurationInMinutes: attendanceStats.totalDurationInMinutes,
        },
      });
    } catch (error) {
      console.error(
        "[liveSessionController] getSessionStatistics error:",
        error,
      );
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  getAttendanceSummary: async function (req, res) {
    try {
      var roomId = req.params.roomId;
      var session = await Session.findOne({ roomId: roomId });
      if (!session) {
        return res
          .status(404)
          .json({ success: false, message: "Session not found." });
      }

      var records = await Attendance.find({ sessionId: roomId }).sort({
        joinTime: 1,
      });
      var stats = attendanceHelper.calculateReportData(records);

      var attendanceList = records.map(function (r) {
        return {
          userId: r.userId,
          studentName: r.studentName,
          studentEmail: r.studentEmail,
          status: r.status,
          joinTime: r.joinTime,
          leaveTime: r.leaveTime,
          durationMinutes: r.duration,
        };
      });

      var liveInfo = buildLiveInfo(roomId);
      var currentlyConnected = liveInfo
        ? liveInfo.participants.filter(function (p) {
            return p.status === "active" && p.role !== "Trainer" && p.role !== "Admin";
          })
        : [];
return res.status(200).json({
        success: true,
        roomId: roomId,
        stats: {
          totalRecords: stats.totalRecords,
          present: stats.present,
          absent: stats.absent,
          late: stats.late,
          attendancePercentage: stats.attendancePercentage,
          totalDurationInMinutes: stats.totalDurationInMinutes,
        },
        totals: {
          present: stats.present,
          absent: stats.absent,
          late: stats.late,
        },
        records: attendanceList,
        attendance: attendanceList,
        currentlyConnected: currentlyConnected,
      });
    } catch (error) {
      console.error(
        "[liveSessionController] getAttendanceSummary error:",
        error,
      );
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  endLiveSession: async function (req, res) {
    try {
      var roomId = req.params.roomId;
      var session = await Session.findOne({ roomId: roomId });
      if (!session) {
        return res
          .status(404)
          .json({ success: false, message: "Session not found." });
      }
      if (session.status === "Completed") {
        return res.status(400).json({
          success: false,
          message: "This session has already ended.",
        });
      }

      var actor = {
        id: req.user.email,
        name: req.user.firstName || req.user.email,
      };

      var io = req.app.get("io");
      if (io && typeof io.forceEndClassroomSession === "function") {
        io.forceEndClassroomSession(roomId, "admin-forced", actor);
      } else {
        await Session.updateOne({ roomId: roomId }, { status: "Completed" });
        activityLogController.createLog(
          roomId,
          "session:ended",
          actor,
          undefined,
          { reason: "admin-forced" },
        );
      }

      return res.status(200).json({
        success: true,
        message: "Session has been forcefully ended by Admin.",
      });
    } catch (error) {
      console.error("[liveSessionController] endLiveSession error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },
};

module.exports = liveSessionController;

var Attendance = require("../models/Attendance.cjs");
function markAttendance(req, res) {
  var userId = req.body.userId;
  var sessionId = req.body.sessionId;
  var joinTime = req.body.joinTime;
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "userId is required." });
  }
  if (!sessionId) {
    return res
      .status(400)
      .json({ success: false, message: "sessionId is required." });
  }
  if (!joinTime) {
    return res
      .status(400)
      .json({ success: false, message: "joinTime is required." });
  }
  Attendance.findOne({ userId: userId, sessionId: sessionId })
    .then(function (existingRecord) {
      if (existingRecord) {
        return res.status(400).json({
          success: false,
          message: "Attendance already marked for this session.",
        });
      }
      var newRecord = new Attendance({
        userId: userId,
        sessionId: sessionId,
        joinTime: new Date(joinTime),
        status: "Present",
      });

      newRecord
        .save()
        .then(function (saved) {
          res.json({
            success: true,
            message: "Attendance marked successfully.",
            data: saved,
          });
        })
        .catch(function (err) {
          console.log(err);
          res
            .status(500)
            .json({
              success: false,
              message: "Could not save attendance record.",
            });
        });
    })
    .catch(function (err) {
      console.log(err);
      res
        .status(500)
        .json({
          success: false,
          message: "Error while checking for existing record.",
        });
    });
}
function getAttendanceBySession(req, res) {
  var sessionId = req.params.sessionId;

  if (!sessionId) {
    return res
      .status(400)
      .json({ success: false, message: "sessionId is required." });
  }

  Attendance.find({ sessionId: sessionId })
    .then(function (records) {
      res.json({ success: true, data: records });
    })
    .catch(function (err) {
      console.log(err);
      res
        .status(500)
        .json({
          success: false,
          message: "Error fetching attendance records.",
        });
    });
}
function getAttendanceByStudent(req, res) {
  var studentId = req.params.studentId;

  if (!studentId) {
    return res
      .status(400)
      .json({ success: false, message: "studentId is required." });
  }

  Attendance.find({ userId: studentId })
    .then(function (records) {
      res.json({ success: true, data: records });
    })
    .catch(function (err) {
      console.log(err);
      res
        .status(500)
        .json({
          success: false,
          message: "Error fetching student attendance.",
        });
    });
}
function updateAttendance(req, res) {
  var userId = req.body.userId;
  var sessionId = req.body.sessionId;
  var leaveTime = req.body.leaveTime;
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "userId is required." });
  }
  if (!sessionId) {
    return res
      .status(400)
      .json({ success: false, message: "sessionId is required." });
  }
  if (!leaveTime) {
    return res
      .status(400)
      .json({ success: false, message: "leaveTime is required." });
  }
  Attendance.findOne({ userId: userId, sessionId: sessionId })
    .then(function (record) {
      if (!record) {
        return res.status(404).json({
          success: false,
          message: "No attendance record found for this user and session.",
        });
      }
      var joinDate = new Date(record.joinTime);
      var leaveDate = new Date(leaveTime);

      if (leaveDate <= joinDate) {
        return res.status(400).json({
          success: false,
          message: "leaveTime must be after joinTime.",
        });
      }
      var durationInMs = leaveDate - joinDate;
      var durationInMinutes = Math.round(durationInMs / (1000 * 60));

      var updatedStatus = "";
      if (durationInMinutes < 10) {
        updatedStatus = "Absent";
      } else if (durationInMinutes < 30) {
        updatedStatus = "Late";
      } else {
        updatedStatus = "Present";
      }
      record.leaveTime = leaveDate;
      record.duration = durationInMinutes;
      record.status = updatedStatus;

      record
        .save()
        .then(function (updated) {
          res.json({
            success: true,
            message: "Attendance updated successfully.",
            data: updated,
          });
        })
        .catch(function (err) {
          console.log(err);
          res
            .status(500)
            .json({ success: false, message: "Error saving updated record." });
        });
    })
    .catch(function (err) {
      console.log(err);
      res
        .status(500)
        .json({
          success: false,
          message: "Error looking up attendance record.",
        });
    });
}

module.exports = {
  markAttendance: markAttendance,
  getAttendanceBySession: getAttendanceBySession,
  getAttendanceByStudent: getAttendanceByStudent,
  updateAttendance: updateAttendance,
};

var Attendance = require("../models/Attendance.cjs");
function markAttendance(req, res) {
  var userId = req.body.userId;
  var sessionId = req.body.sessionId;
  var joinTime = req.body.joinTime;
  var status = req.body.status;
  var studentName = req.body.studentName;
  var studentEmail = req.body.studentEmail;
  var leaveTime = req.body.leaveTime;
  var date = req.body.date;
  var markedBy = "";
  if (req.user && req.user.email) {
    markedBy = req.user.email;
  }
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
  if (status === undefined || status === "") {
    status = "Present";
  }
  if (status !== "Present" && status !== "Absent" && status !== "Late") {
    return res.status(400).json({
      success: false,
      message: "Invalid status value. Status must be Present, Absent, or Late.",
    });
  }
  Attendance.findOne({ userId: userId, sessionId: sessionId })
    .then(function (existingRecord) {
      if (existingRecord) {
        return res.status(400).json({
          success: false,
          message: "Attendance already marked for this session.",
        });
      }
      var recordData = {
        userId: userId,
        sessionId: sessionId,
        joinTime: new Date(joinTime),
        status: status,
      };
      if (studentName) {
        recordData.studentName = studentName;
      }
      if (studentEmail) {
        recordData.studentEmail = studentEmail;
      }
      if (markedBy) {
        recordData.markedBy = markedBy;
      }
      if (date) {
        recordData.date = date;
      }
      if (leaveTime) {
        recordData.leaveTime = new Date(leaveTime);
        var joinMs = new Date(joinTime).getTime();
        var leaveMs = new Date(leaveTime).getTime();
        if (leaveMs > joinMs) {
          recordData.duration = Math.round((leaveMs - joinMs) / (1000 * 60));
        }
      }

      var newRecord = new Attendance(recordData);

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
          res.status(500).json({
            success: false,
            message: "Could not save attendance record.",
          });
        });
    })
    .catch(function (err) {
      console.log(err);
      res.status(500).json({
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
      res.status(500).json({
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
      res.status(500).json({
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
      var manualStatus = req.body.status;
      var updatedStatus;

      if (manualStatus !== undefined && manualStatus !== "") {
        if (
          manualStatus !== "Present" &&
          manualStatus !== "Absent" &&
          manualStatus !== "Late"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid status value. Status must be Present, Absent, or Late.",
          });
        }
        updatedStatus = manualStatus;
      } else {
        if (durationInMinutes < 10) {
          updatedStatus = "Absent";
        } else if (durationInMinutes < 30) {
          updatedStatus = "Late";
        } else {
          updatedStatus = "Present";
        }
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
      res.status(500).json({
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

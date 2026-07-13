var express = require("express");
var router = express.Router();
var attendanceController = require("../controllers/attendanceController.cjs");
module.exports = function (verifyToken, checkRole) {
  router.post(
    "/mark",
    verifyToken,
    checkRole(["Student", "Teacher", "Employee", "Admin"]),
    attendanceController.markAttendance,
  );
  router.get(
    "/session/:sessionId",
    verifyToken,
    checkRole(["Teacher", "Admin"]),
    attendanceController.getAttendanceBySession,
  );
  router.get(
    "/student/:studentId",
    verifyToken,
    checkRole(["Student", "Teacher", "Employee", "Admin"]),
    attendanceController.getAttendanceByStudent,
  );
  router.put(
    "/update",
    verifyToken,
    checkRole(["Student", "Teacher", "Employee", "Admin"]),
    attendanceController.updateAttendance,
  );

  return router;
};

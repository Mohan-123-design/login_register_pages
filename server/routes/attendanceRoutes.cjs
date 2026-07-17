var express = require("express");
var router = express.Router();
var attendanceController = require("../controllers/attendanceController.cjs");
module.exports = function (verifyToken, checkRole) {
  router.post(
    "/mark",
    verifyToken,
    checkRole(["Student", "Trainer", "Employee", "Admin"]),
    attendanceController.markAttendance,
  );
  router.get(
    "/session/:sessionId",
    verifyToken,
    checkRole(["Trainer", "Admin"]),
    attendanceController.getAttendanceBySession,
  );
  router.get(
    "/student/:studentId",
    verifyToken,
    checkRole(["Student", "Trainer", "Employee", "Admin"]),
    attendanceController.getAttendanceByStudent,
  );
  router.put(
    "/update",
    verifyToken,
    checkRole(["Student", "Trainer", "Employee", "Admin"]),
    attendanceController.updateAttendance,
  );
  router.get(
    "/report/:sessionId",
    verifyToken,
    checkRole(["Trainer", "Admin"]),
    attendanceController.getSessionReport,
  );

  router.get(
    "/student-report/:studentId",
    verifyToken,
    checkRole(["Student", "Trainer", "Employee", "Admin"]),
    attendanceController.getStudentReport,
  );

  return router;
};

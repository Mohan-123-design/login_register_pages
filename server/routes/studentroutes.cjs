var express = require("express");
var router = express.Router();
var attendanceController = require("../controllers/attendanceController.cjs");

module.exports = function (verifyToken, checkRole) {
  router.get(
    "/",
    verifyToken,
    checkRole(["Trainer", "Admin"]),
    attendanceController.getStudentsList,
  );

  return router;
};
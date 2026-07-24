var express = require("express");
var router = express.Router();
var sessionController = require("../controllers/sessionController.cjs");

module.exports = function (verifyToken, checkRole) {
  router.post(
    "/",
    verifyToken,
    checkRole(["Trainer", "Admin"]),
    sessionController.createSession
  );

  router.get(
    "/",
    verifyToken,
    checkRole(["Trainer", "Admin"]),
    sessionController.getSessions
  );

  router.delete(
    "/:roomId",
    verifyToken,
    checkRole(["Trainer", "Admin"]),
    sessionController.deleteSession
  );

  return router;
};

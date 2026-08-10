var express = require("express");
var router = express.Router();
var liveSessionController = require("../controllers/livesessioncontroller.cjs");

module.exports = function (verifyToken, checkRole) {
  router.get(
    "/",
    verifyToken,
    checkRole(["Admin"]),
    liveSessionController.getLiveSessions,
  );

  router.get(
    "/:roomId/stats",
    verifyToken,
    checkRole(["Admin"]),
    liveSessionController.getSessionStatistics,
  );

  router.get(
    "/:roomId/attendance-summary",
    verifyToken,
    checkRole(["Admin"]),
    liveSessionController.getAttendanceSummary,
  );

  router.post(
    "/:roomId/end",
    verifyToken,
    checkRole(["Admin"]),
    liveSessionController.endLiveSession,
  );

  return router;
};
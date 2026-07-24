var express = require("express");
var activityLogController = require("../controllers/activityLogController.cjs");

module.exports = function (verifyToken, checkRole) {
  var router = express.Router();
  router.get(
    "/:sessionId",
    verifyToken,
    checkRole(["Trainer", "Admin"]),
    activityLogController.getLogs,
  );

  return router;
};

var express = require("express");
var router = express.Router();
var feedbackController = require("../controllers/feedbackcontroller.cjs");

module.exports = function (verifyToken, checkRole) {
  router.post(
    "/",
    verifyToken,
    checkRole(["Student", "Employee"]),
    feedbackController.submitFeedback,
  );
  router.get(
    "/session/:sessionId",
    verifyToken,
    checkRole(["Trainer", "Admin"]),
    feedbackController.getFeedbackBySession,
  );
  router.get(
    "/trainer/:trainerId",
    verifyToken,
    checkRole(["Trainer", "Admin"]),
    feedbackController.getTrainerFeedback,
  );

  return router;
};
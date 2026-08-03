var express = require("express");
var router = express.Router();
var recordingController = require("../controllers/recordingcontroller.cjs");

module.exports = function (verifyToken, checkRole) {
  router.post(
    "/",
    verifyToken,
    checkRole(["Trainer", "Admin"]),
    recordingController.uploadRecordingMetadata
  );

  router.get(
    "/",
    verifyToken,
    checkRole(["Student", "Trainer", "Employee", "Admin"]),
    recordingController.getAllRecordings
  );

  router.get(
    "/analytics/most-viewed",
    verifyToken,
    checkRole(["Trainer", "Admin"]),
    recordingController.getMostViewedRecordings
  );

  router.get(
    "/:id",
    verifyToken,
    checkRole(["Student", "Trainer", "Employee", "Admin"]),
    recordingController.getRecordingDetails
  );

  router.put(
    "/:id",
    verifyToken,
    checkRole(["Trainer", "Admin"]),
    recordingController.updateRecordingMetadata
  );

  router.patch(
    "/:id/status",
    verifyToken,
    checkRole(["Trainer", "Admin"]),
    recordingController.updateRecordingStatus
  );

  router.delete(
    "/:id",
    verifyToken,
    checkRole(["Trainer", "Admin"]),
    recordingController.deleteRecording
  );

  router.get(
    "/:id/playback",
    verifyToken,
    checkRole(["Student", "Trainer", "Employee", "Admin"]),
    recordingController.getPlaybackAuthorization
  );

  router.post(
    "/:id/watch-progress",
    verifyToken,
    checkRole(["Student", "Trainer", "Employee", "Admin"]),
    recordingController.logWatchProgress
  );

  router.get(
    "/:id/download",
    verifyToken,
    checkRole(["Student", "Trainer", "Employee", "Admin"]),
    recordingController.downloadRecording
  );

  router.get(
    "/:id/analytics",
    verifyToken,
    checkRole(["Trainer", "Admin"]),
    recordingController.getRecordingAnalytics
  );

  return router;
};
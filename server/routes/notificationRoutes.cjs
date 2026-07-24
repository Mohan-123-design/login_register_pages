var express = require("express");
var router = express.Router();
var notificationController = require("../controllers/notificationController.cjs");

module.exports = function (verifyToken, checkRole) {
  router.post(
    "/",
    verifyToken,
    checkRole(["Admin", "Trainer"]),
    notificationController.createNotification,
  );
  router.get(
    "/",
    verifyToken,
    checkRole(["Admin", "Trainer"]),
    notificationController.getAllNotifications,
  );
  router.get(
    "/my",
    verifyToken,
    checkRole(["Student", "Trainer", "Employee", "Admin"]),
    notificationController.getMyNotifications,
  );
  router.get(
    "/:id",
    verifyToken,
    checkRole(["Student", "Trainer", "Employee", "Admin"]),
    notificationController.getNotificationById,
  );
  router.put(
    "/:id/read",
    verifyToken,
    checkRole(["Student", "Trainer", "Employee", "Admin"]),
    notificationController.markAsRead,
  );
  router.put(
    "/:id",
    verifyToken,
    checkRole(["Admin", "Trainer"]),
    notificationController.updateNotification,
  );
  router.delete(
    "/:id",
    verifyToken,
    checkRole(["Admin"]),
    notificationController.deleteNotification,
  );

  return router;
};

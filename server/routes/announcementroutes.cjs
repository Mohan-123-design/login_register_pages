var express = require("express");
var router = express.Router();
var announcementController = require("../controllers/announcementcontroller.cjs");

module.exports = function (verifyToken, checkRole) {
  router.post(
    "/",
    verifyToken,
    checkRole(["Trainer", "Admin"]),
    announcementController.createAnnouncement,
  );
  router.get(
    "/",
    verifyToken,
    checkRole(["Trainer", "Admin", "Student", "Employee"]),
    announcementController.getAnnouncements,
  );
  router.patch(
    "/:id/read",
    verifyToken,
    checkRole(["Trainer", "Admin", "Student", "Employee"]),
    announcementController.markAsRead,
  );
  router.delete(
    "/:id",
    verifyToken,
    checkRole(["Trainer", "Admin"]),
    announcementController.deleteAnnouncement,
  );

  return router;
};
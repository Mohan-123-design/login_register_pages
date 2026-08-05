var express = require("express");
var router = express.Router();
var userManagementController = require("../controllers/usermanagementcontroller.cjs");

module.exports = function (verifyToken, checkRole) {
  router.use(verifyToken, checkRole(["Admin"]));
  router.get("/", userManagementController.getAllUsers);
  router.get("/:id", userManagementController.getUserById);
  router.post("/", userManagementController.createUser);
  router.put("/:id", userManagementController.updateUser);
  router.patch("/:id/status", userManagementController.toggleUserStatus);
  router.patch("/:id/reset-password", userManagementController.resetUserPassword);
  router.delete("/:id", userManagementController.deleteUser);

  return router;
};
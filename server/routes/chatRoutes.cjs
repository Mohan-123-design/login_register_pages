var express = require("express");
var router = express.Router();
var chatController = require("../controllers/chatController.cjs");
module.exports = function (verifyToken, checkRole) {
  router.post(
    "/send",
    verifyToken,
    checkRole(["Student", "Trainer", "Employee", "Admin"]),
    chatController.sendMessage,
  );
  router.get(
    "/session/:sessionId",
    verifyToken,
    checkRole(["Student", "Trainer", "Employee", "Admin"]),
    chatController.getSessionMessages,
  );
  router.delete(
    "/:messageId",
    verifyToken,
    checkRole(["Trainer", "Admin"]),
    chatController.deleteMessage,
  );

  return router;
};

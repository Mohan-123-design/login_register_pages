var express = require("express");
var router = express.Router();
var whiteboardController = require("../controllers/whiteboardController.cjs");

module.exports = function (verifyToken, checkRole) {
  router.post(
    "/save",
    verifyToken,
    checkRole(["Student", "Trainer", "Employee", "Admin"]),
    whiteboardController.saveWhiteboard,
  );
  router.get(
    "/:sessionId",
    verifyToken,
    checkRole(["Student", "Trainer", "Employee", "Admin"]),
    whiteboardController.getWhiteboard,
  );
  router.put(
    "/:sessionId",
    verifyToken,
    checkRole(["Student", "Trainer", "Employee", "Admin"]),
    whiteboardController.updateWhiteboard,
  );
  router.delete(
    "/:sessionId",
    verifyToken,
    checkRole(["Trainer", "Admin"]),
    whiteboardController.deleteWhiteboard,
  );

  return router;
};

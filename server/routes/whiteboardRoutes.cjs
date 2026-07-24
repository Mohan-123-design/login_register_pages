var express = require("express");
var router = express.Router();
var whiteboardController = require("../controllers/whiteboardController.cjs");

module.exports = function (verifyToken, checkRole) {
  var allRoles = ["Student", "Trainer", "Employee", "Admin"];
  
  router.post("/stroke", verifyToken, checkRole(allRoles), whiteboardController.saveStroke);
  router.get("/:sessionId", verifyToken, checkRole(allRoles), whiteboardController.getWhiteboard);
  router.delete("/:sessionId", verifyToken, checkRole(["Trainer", "Admin"]), whiteboardController.deleteWhiteboard);
  
  router.post("/sticky", verifyToken, checkRole(allRoles), whiteboardController.addSticky);
  router.put("/sticky/:noteId", verifyToken, checkRole(allRoles), whiteboardController.updateSticky);
  router.delete("/sticky/:noteId", verifyToken, checkRole(allRoles), whiteboardController.removeSticky);

  return router;
};

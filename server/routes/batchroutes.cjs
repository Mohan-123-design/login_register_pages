var express = require("express");
var router = express.Router();
var batchController = require("../controllers/batchcontroller.cjs");

module.exports = function (verifyToken, checkRole) {
  router.use(verifyToken, checkRole(["Admin"]));
  router.get("/stats", batchController.getBatchStats);
  router.get("/", batchController.getAllBatches);
  router.get("/:id", batchController.getBatchById);
  router.post("/", batchController.createBatch);
  router.put("/:id", batchController.updateBatch);
  router.patch("/:id/assign-trainer", batchController.assignTrainer);
  router.patch("/:id/status", batchController.updateStatus);
  router.get("/:id/available-students", batchController.getAvailableStudents);
  router.post("/:id/students", batchController.allocateStudents);
  router.delete("/:id/students/:email", batchController.removeStudent);
  router.delete("/:id", batchController.deleteBatch);

  return router;
};
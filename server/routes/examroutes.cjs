var express = require("express");
var router = express.Router();
var examController = require("../controllers/examcontroller.cjs");

module.exports = function (verifyToken, checkRole) {
  router.use(verifyToken);
  router.get("/", checkRole(["Admin", "Trainer", "Student", "Employee"]), examController.getAllExams);
  router.get("/:id", checkRole(["Admin", "Trainer", "Student", "Employee"]), examController.getExamById);
  router.get("/:id/my-result", checkRole(["Student", "Employee"]), examController.getMyResult);
  router.post("/:id/submit", checkRole(["Student", "Employee"]), examController.submitExam);
  router.post("/", checkRole(["Admin", "Trainer"]), examController.createExam);
  router.put("/:id", checkRole(["Admin", "Trainer"]), examController.updateExam);
  router.delete("/:id", checkRole(["Admin", "Trainer"]), examController.deleteExam);
  router.patch("/:id/publish", checkRole(["Admin", "Trainer"]), examController.publishExam);
  router.patch("/:id/unpublish", checkRole(["Admin", "Trainer"]), examController.unpublishExam);
  router.get("/:id/results", checkRole(["Admin", "Trainer"]), examController.getResultSummary);
  router.post("/:id/results", checkRole(["Admin", "Trainer"]), examController.upsertResult);
  router.get("/:id/analytics", checkRole(["Admin", "Trainer"]), examController.getAnalytics);

  return router;
};
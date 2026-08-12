var express = require("express");
var router = express.Router();
var assignmentController = require("../controllers/assignmentcontroller.cjs");

module.exports = function (verifyToken, checkRole) {
  router.use(verifyToken);
  router.get("/", checkRole(["Admin", "Trainer", "Student", "Employee"]), assignmentController.getAllAssignments);
  router.get("/:id", checkRole(["Admin", "Trainer", "Student", "Employee"]), assignmentController.getAssignmentById);
  router.post("/", checkRole(["Admin", "Trainer"]), assignmentController.createAssignment);
  router.put("/:id", checkRole(["Admin", "Trainer"]), assignmentController.updateAssignment);
  router.delete("/:id", checkRole(["Admin", "Trainer"]), assignmentController.deleteAssignment);
  router.patch("/:id/publish", checkRole(["Admin", "Trainer"]), assignmentController.publishAssignment);
  router.patch("/:id/unpublish", checkRole(["Admin", "Trainer"]), assignmentController.unpublishAssignment);
  router.patch("/:id/open", checkRole(["Admin", "Trainer"]), assignmentController.openAssignment);
  router.patch("/:id/close", checkRole(["Admin", "Trainer"]), assignmentController.closeAssignment);
  router.patch("/:id/complete", checkRole(["Admin", "Trainer"]), assignmentController.completeAssignment);
  router.post("/:id/submit", checkRole(["Student", "Employee"]), assignmentController.submitAssignment);
  router.get("/:id/my-submission", checkRole(["Student", "Employee"]), assignmentController.getMySubmission);
  router.get("/:id/submissions", checkRole(["Admin", "Trainer"]), assignmentController.getSubmissions);
  router.post("/:id/grade", checkRole(["Admin", "Trainer"]), assignmentController.gradeSubmission);
  router.get("/:id/overview", checkRole(["Admin", "Trainer"]), assignmentController.getOverview);

  return router;
};
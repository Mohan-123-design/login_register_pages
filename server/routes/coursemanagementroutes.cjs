var express = require("express");
var router = express.Router();
var courseManagementController = require("../controllers/coursemanagementcontroller.cjs");

module.exports = function (verifyToken, checkRole) {
  router.use(verifyToken, checkRole(["Admin"]));
  router.get("/stats", courseManagementController.getCourseStats);
  router.get("/", courseManagementController.getAllCourses);
  router.get("/:id", courseManagementController.getCourseById);
  router.post("/", courseManagementController.createCourse);
  router.put("/:id", courseManagementController.updateCourse);
  router.patch("/:id/assign-trainer", courseManagementController.assignTrainer);
  router.patch("/:id/archive", courseManagementController.archiveCourse);
  router.delete("/:id", courseManagementController.deleteCourse);

  return router;
};
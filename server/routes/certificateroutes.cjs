var express = require("express");
var router = express.Router();
var certificateController = require("../controllers/certificatecontroller.cjs");

module.exports = function (verifyToken, checkRole) {
  router.get("/verify/:code", certificateController.verifyCertificate);
  router.post(
    "/",
    verifyToken,
    checkRole(["Admin"]),
    certificateController.generateCertificate,
  );

  router.get(
    "/",
    verifyToken,
    checkRole(["Admin", "Trainer"]),
    certificateController.getAllCertificates,
  );

  router.get(
    "/my",
    verifyToken,
    checkRole(["Student", "Employee"]),
    certificateController.getMyCertificates,
  );

  router.patch(
    "/:certificateId/status",
    verifyToken,
    checkRole(["Admin"]),
    certificateController.updateCertificateStatus,
  );

  router.get(
    "/:certificateId/download",
    verifyToken,
    checkRole(["Student", "Employee", "Trainer", "Admin"]),
    certificateController.downloadCertificate,
  );

  return router;
};
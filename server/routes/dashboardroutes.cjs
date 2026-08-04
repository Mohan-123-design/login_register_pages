var express = require("express");
var router = express.Router();
var dashboardController = require("../controllers/dashboardcontroller.cjs");

module.exports = function (verifyToken, checkRole) {
  router.get(
    "/",
    verifyToken,
    checkRole(["Admin"]),
    dashboardController.getDashboard,
  );

  return router;
};
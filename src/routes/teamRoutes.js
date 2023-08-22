const express = require("express");
const authController = require("../controllers/authController");
const teamController = require("../controllers/teamController.js");

const router = express.Router();

router
  .route("/")
  .get(
    authController.protectRoutes,
    authController.adminOnly,
    teamController.getAllTeams
  );

router
  .route("/:id")
  .get(authController.protectRoutes, teamController.getTeam)
  .patch(
    authController.protectRoutes,
    authController.adminOnly,
    teamController.updateTeam
  )
  .delete(
    authController.protectRoutes,
    authController.adminOnly,
    teamController.deleteTeam
  );

module.exports = router;

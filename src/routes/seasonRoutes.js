const express = require("express");
const seasonController = require("../controllers/seasonController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protectRoutes, authController.adminOnly);
router
  .route("/")
  .post(
    authController.protectRoutes,
    authController.adminOnly,
    seasonController.createSeason
  )
  .get(seasonController.getAllSeasons);

router
  .route("/:id")
  .get(seasonController.getSeason)
  .patch(seasonController.updateSeason)
  .delete(seasonController.deleteSeason);

module.exports = router;

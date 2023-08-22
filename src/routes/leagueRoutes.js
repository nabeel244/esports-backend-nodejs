const express = require("express");
const leagueController = require("../controllers/leagueController");
const authController = require("../controllers/authController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router
  .route("/")
  .get(
    authController.protectRoutes,
    authController.adminOnly,
    leagueController.getAllLeagues
  )
  .post(
    authController.protectRoutes,
    authController.adminOnly,
    leagueController.createLeague
  );

router
  .route("/:id/invite")
  .patch(
    authController.protectRoutes,
    authController.adminOnly,
    leagueController.invitePeople
  );
router.get(
  "/:id/select-participating-pokemon",
  leagueController.selectParticipatingPokemon
);

router
  .route("/:id")
  .get(leagueController.getLeague)
  .patch(leagueController.updateLeague)
  .delete(leagueController.deleteLeague);

router.patch(
  "/:id/join",
  authController.protectRoutes,
  leagueController.joinLeague
);
router.patch(
  "/:id/select-banned-pokemon",
  authController.protectRoutes,
  leagueController.selectBannedPokemon
);

router.post(
  "/chat",
  asyncHandler(async (req, res) => {
    const { io, socket, msg } = req.body;
    await leagueController.handleChatMessage(io, socket, msg);
    res.status(200).send("Message sent");
  })
);

// Update player stats when a match is played
router.post("/play", leagueController.playMatch);

module.exports = router;

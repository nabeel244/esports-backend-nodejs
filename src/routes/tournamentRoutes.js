const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const tournamentController = require("../controllers/tournamentController");

router
  .route("/")
  .post(
    authController.protectRoutes,
    authController.adminOnly,
    tournamentController.upload,
    tournamentController.createTournament
  )
  .get(
    // authController.protectRoutes,
    // authController.adminOnly,
    tournamentController.getAllTournaments
  );

router.post(
  "/:id/join",
  authController.protectRoutes,
  tournamentController.upload,
  tournamentController.joinTournament
);

router.patch(
  "/:id/checkin",
  authController.protectRoutes,
  tournamentController.checkInTournament
);

router.get(
  "/upcoming",
  authController.protectRoutes,
  tournamentController.upcomingTournaments
);

router.get(
  "/concluded",
  authController.protectRoutes,
  tournamentController.concludedTournaments
);

router.get(
  "/current",
  authController.protectRoutes,
  tournamentController.currentTournaments
);
router.get("/featured-events", tournamentController.getFeaturedEvents);

router.patch(
  "/:id/start",
  authController.protectRoutes,
  authController.adminOnly,
  tournamentController.startTournament
);

router
  .route("/:id/match")
  .post(authController.protectRoutes, tournamentController.createMatch);

router.patch(
  "/:id/leave",
  authController.protectRoutes,
  tournamentController.leaveTournament
);

// for public tournament
router.get("/:id/matches", tournamentController.publicTournamentMatches);

// next match of the current player
router.get(
  "/:tournamentId/nextMatch",
  authController.protectRoutes,
  tournamentController.getNextMatch
);

router.get(
  "/latestMatch/:tournamentId",
  authController.protectRoutes,
  tournamentController.latestMatch
);

router.get(
  "/:id/outcomes",
  authController.protectRoutes,
  tournamentController.reportOutcomes
);

router.patch(
  "/add-friend",
  authController.protectRoutes,
  tournamentController.addFriend
);

router.patch(
  "/:id/outcomes",
  authController.protectRoutes,
  tournamentController.submitOutcomes
);

router.patch(
  "/pin/:tournamentId",
  authController.protectRoutes,
  authController.adminOnly,
  tournamentController.pinTournament
);

router.patch(
  "/unpin/:tournamentId",
  authController.protectRoutes,
  authController.adminOnly,
  tournamentController.unpinTournament
);

router.get(
  "/pin-tournaments",
  authController.protectRoutes,
  tournamentController.getPinedTournament
);

router
  .route("/:id")
  .patch(
    authController.protectRoutes,
    authController.adminOnly,
    tournamentController.updateTournament
  )
  .delete(
    authController.protectRoutes,
    authController.adminOnly,
    tournamentController.deleteTournament
  )
  .get(authController.protectRoutes, tournamentController.getTournamentById);

router.route("/:id/players").get(tournamentController.getTournamentPlayers);

module.exports = router;

const express = require("express");
const router = express.Router();
const passport = require("passport");
const Oauth = require("../config/Oauth");

// Google Oauth Routes
const auth = passport.authenticate("google", { scope: ["profile", "email"] });
router.get("/google", auth);
router.get(
  "/google/callback",
  passport.authenticate("google"),
  Oauth.redirectCallback
);

// Facebook Oauth Routes
const authenticate = passport.authenticate("facebook", { scope: ["email"] });
router.get("/facebook", authenticate);
router.get(
  "/facebook/callback",
  passport.authenticate("facebook"),
  Oauth.redirectCallback
);

// Twitter Oauth Routes
router.get("/twitter", passport.authenticate("twitter"));
router.get(
  "/twitter/callback",
  passport.authenticate("twitter"),
  Oauth.redirectCallback
);

// Reddit Oauth Routes
router.get("/reddit", Oauth.redditAuth);
router.get("/reddit/callback", Oauth.redditCallback);

module.exports = router;

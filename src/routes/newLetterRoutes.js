const express = require("express");
const newsController = require("../controllers/newsLetterController");
const authController = require("../controllers/authController");
const router = express.Router();

router.route("/").post(newsController.subscribe).get(
  authController.protectRoutes,
  // authController.adminOnly,
  newsController.getAllSubscribers
);

router.route("/:id").delete(
  authController.protectRoutes,
  // authController.adminOnly,
  newsController.deleteNews
);

router.route("/news").post(newsController.newsLetter);

module.exports = router;

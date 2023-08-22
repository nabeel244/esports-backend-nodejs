const express = require("express");
const blogController = require("../controllers/blogController");
const authController = require("../controllers/authController");
const router = express.Router();

router
  .route("/")
  .post(
    authController.protectRoutes,
    blogController.upload,
    blogController.createBlog
  )
  .get(blogController.getAllBlogs);

router
  .route("/:id")
  .get(blogController.getBlog)
  .delete(authController.protectRoutes, blogController.deleteBlog)
  .patch(
    authController.protectRoutes,
    blogController.upload,
    blogController.updateBlog);

router.get("/get/popular", blogController.popular);
router.get("/get/related", blogController.related);

router.get(
  "/share/fB/:id",
  authController.protectRoutes,
  blogController.fbShare
);

router.get(
  "/share/twitter/:id",
  authController.protectRoutes,
  blogController.twitterShare
);

router.get(
  "/share/instagram/:id",
  authController.protectRoutes,
  blogController.instaShare
);

router.get(
  "/share/discord/:id",
  authController.protectRoutes,
  blogController.discordShare
);

router.get(
  "/share/youtube/:id",
  authController.protectRoutes,
  blogController.ytShare
);

module.exports = router;

const express = require("express");
const contactUsController = require("../controllers/contactController");
const authController = require("../controllers/authController");

const router = express.Router();

router
  .route("/")
  .get(
    authController.protectRoutes,
    authController.adminOnly,
    contactUsController.getAllQueries
  )
  .post(contactUsController.createUserResponse);

router
  .route("/:id")
  .delete(
    authController.protectRoutes,
    authController.adminOnly,
    contactUsController.deleteContact
  )
  .get(
    authController.protectRoutes,
    authController.adminOnly,
    contactUsController.getContact
  );

module.exports = router;

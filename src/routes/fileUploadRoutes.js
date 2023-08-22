const router = require("express").Router();
const multer = require("multer");
const authController = require("../controllers/authController");
const fileUploads = require("../controllers/fileUploadsController.js");

router.get("/:id", fileUploads.getFile);

router.use(authController.protectRoutes, authController.adminOnly);
router.route("/").post(fileUploads.uploadFile, fileUploads.createFile);
router
  .route("/:id")
  .patch(fileUploads.uploadFile, fileUploads.updateFile)
  .delete(fileUploads.deleteFile);

module.exports = router;

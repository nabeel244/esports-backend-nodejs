const router = require("express").Router();
const { auth } = require("googleapis/build/src/apis/abusiveexperiencereport");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

// router.use(authController.protectRoutes);
// router.post("/admin/register", authController.userRegistration("admin"));
router.post("/admin/login", authController.userLogin);

router.get(
  "/",
  authController.protectRoutes,
  authController.adminOnly,
  userController.getAllUsers
);

// router.post("/register", authController.userRegistration("user"));
// router.post("/login", authController.userLogin);
router.get("/me", authController.protectRoutes, userController.getCurrentUser);

router
  .route("/profile")
  .patch(authController.protectRoutes, userController.createUserProfile);

router.patch(
  "/profilePhoto",
  authController.protectRoutes,
  userController.upload,
  userController.uploadImages
);

router
  .route("/top-players")
  .get(authController.protectRoutes, userController.leaderboard);

router.get(
  "/national-board/:country",
  authController.protectRoutes,
  userController.nationalLeaderBoard
);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(
    authController.protectRoutes,
    authController.adminOnly,
    userController.updateUser
  )
  .delete(
    authController.protectRoutes,
    authController.adminOnly,
    userController.deleteUser
  );

router.post("/register/verify/:id/:token", authController.verify);
router.use(authController.isVerified);
router.post("/resetPassword", authController.resetMail);
router.post("/resetPassword/:userId/:token", authController.resetPassword);

router.use(authController.protectRoutes);
router.patch("/updatePassword", authController.updateMyPassword);
router.patch("/updateMe", authController.updateMe);
router.delete("/deleteMe", authController.deleteMe);

module.exports = router;

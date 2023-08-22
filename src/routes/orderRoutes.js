const express = require("express");
const orderController = require("../controllers/orderController");
const authController = require("../controllers/authController");
const router = express.Router();

router.use(authController.protectRoutes);

router.get(
  "/",
  authController.protectRoutes,
  authController.adminOnly,
  orderController.getAllOrders
);

router
  .route("/:id")
  .get(authController.protectRoutes, orderController.getById)
  .patch(
    authController.protectRoutes,
    authController.adminOnly,
    orderController.update
  )
  .delete(
    authController.protectRoutes,
    authController.adminOnly,
    orderController.delete
  );

// router.get("/payment/checkout", orderController.payment);
router.post(
  "/checkout-session/:productId",
  authController.protectRoutes,
  orderController.checkout
);

module.exports = router;

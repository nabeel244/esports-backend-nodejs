const express = require("express");
const productController = require("../controllers/productController");
const authController = require("../controllers/authController");
const router = express.Router();

router
  .route("/")
  .post(
    authController.protectRoutes,
    productController.uploadImgs,
    productController.createProduct
  )
  .get(productController.getAllProducts);

router
  .route("/:id")
  .get(authController.protectRoutes, productController.getProduct)
  .delete(authController.protectRoutes, productController.delete)
  .patch(
    authController.protectRoutes,
    productController.uploadImgs,
    productController.update
  );

module.exports = router;

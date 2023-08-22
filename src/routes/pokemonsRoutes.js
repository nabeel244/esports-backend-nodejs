const express = require("express");
const { auth } = require("google-auth-library");
const router = express.Router();
const authController = require("../controllers/authController");
const pokemonController = require("../controllers/pokemonController.js");

router
  .route("/")
  .post(
    authController.protectRoutes,
    authController.adminOnly,
    pokemonController.uploadSticker,
    pokemonController.uploadPokemon
  )
  .get(authController.protectRoutes, pokemonController.getAllPokemons);

router
  .route("/:id")
  .patch(
    authController.protectRoutes,
    authController.adminOnly,
    pokemonController.uploadSticker,
    pokemonController.updatePokemon
  )
  .delete(
    authController.protectRoutes,
    authController.adminOnly,
    pokemonController.deletePokemon
  )
  .get(authController.protectRoutes, pokemonController.getPokemon);

module.exports = router;

const express = require("express");

const searchController = require("../controllers/searchController");

const router = express.Router();

router.route("/:searchText").get(searchController.search);

module.exports = router;

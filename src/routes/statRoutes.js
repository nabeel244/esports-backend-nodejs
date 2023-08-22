const router = require("express").Router();
const statController = require("../controllers/statsController");

router.get("/stat1", statController.stat1);

module.exports = router;

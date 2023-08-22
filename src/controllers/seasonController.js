const Match = require("../models/matchModel");
const League = require("../models/leagueModel");
const User = require("../models/userModel");
const Tournament = require("../models/tournamentModel");
const Season = require("../models/seasonsModel");

const asyncHandler = require("../utils/asyncHandler");
const factory = require("../controllers/factoryController");

exports.createSeason = asyncHandler(async (req, res, next) => {
  const { month, year, day } = req.body;
  const { mon, yr, dy } = req.body.endDate;
  const date = new Date(year, month - 1, day);
  const date2 = new Date(yr, mon - 1, dy);

  const startLocaleStringDate = date.toLocaleString();
  const endLocaleStringDate = date2.toLocaleString();

  req.body.startDate = startLocaleStringDate;
  req.body.endDate = endLocaleStringDate;

  const season = await Season.create(req.body);
  res.status(201).json({
    status: "success",
    message: "Season Created successfully!",
    data: season,
  });
});

exports.updateSeason = factory.updateById(Season);
exports.getSeason = factory.getById(Season);
exports.getAllSeasons = factory.getAll(Season);
exports.deleteSeason = factory.deleteById(Season);

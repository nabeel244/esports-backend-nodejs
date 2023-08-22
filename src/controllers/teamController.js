const asyncHandler = require("../utils/asyncHandler");
const { ErrorHandler } = require("../utils/errorHandlers");
const Team = require("../models/teamModel");
const Tournament = require("../models/tournamentModel");
const factory = require("../controllers/factoryController");

exports.updateTeam = asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.id);
  const tournament = await Tournament.findById(team.tournament);
  if (tournament.started)
    next(
      new ErrorHandler(
        "Sorry Tournament is started and now teams can't be updated"
      )
    );

  const updatedTeam = await Team.findByIdAndUpdate(req.params.id, req.body);
  res.status(200).json({
    status: "success",
    message: "Team Updated Successfully!",
    updatedTeam,
  });
});

exports.deleteTeam = asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.id);
  await Tournament.findByIdAndUpdate(team.tournament, {
    $pull: { team: req.params.id },
  });
  await team.delete();

  res.status(204).json({
    status: "success",
    message: "Team deleted successfully!",
  });
});

exports.getAllTeams = factory.getAll(Team);
exports.getTeam = factory.getById(Team);

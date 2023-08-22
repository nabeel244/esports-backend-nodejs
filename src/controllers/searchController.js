const path = require("path");
const User = require("../models/userModel");
const Tournament = require("../models/tournamentModel");
const { ErrorHandler } = require("../utils/errorHandlers");
const Match = require("../models/tournamentModel");
const asyncHandler = require("../utils/asyncHandler");
const BlogPost = require("../models/blogModel");
const League = require("../models/leagueModel");

exports.search = async (req, res, next) => {
  const queryString = req.params.searchText;
  let data = [];
  // Search Player Schema if found add them into the ans array.
  const user = await User.find({
    name: { $regex: `${queryString}`, $options: "i" },
  });
  data.push(user);

  // Search the BlogPost and look if the title or the author name matches the queryString
  const blog = await BlogPost.find({
    title: { $regex: `${queryString}`, $options: "i" },
  });
  data.push(blog);

  //Search the tournament
  const tournament = await Tournament.find({
    name: { $regex: `${queryString}`, $options: "i" },
  });
  data.push(tournament);

  // search the leagues
  const league = await League.find({
    name: { $regex: `${queryString}`, $options: "i" },
  });
  data.push(league);

  res.status(201).json({
    status: "successs",
    data,
  });
};

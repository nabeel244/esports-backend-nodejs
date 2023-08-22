const Match = require("../models/matchModel");
const League = require("../models/leagueModel");
const User = require("../models/userModel");
const asyncHandler = require("../utils/asyncHandler");
const Tournament = require("../models/tournamentModel");
const Season = require("../models/seasonsModel");
const { Email } = require("../utils/sendEmail");
const Pokemon = require("../models/pokemonModel");

exports.createLeague = asyncHandler(async (req, res) => {
  const { season } = req.body;
  const league = await League.create(req.body);

  await Season.findOneAndUpdate(
    { name: season },
    { $push: { leagues: league.id } }
  );

  res.status(201).json({
    status: "league successfully created",
    data: { league },
  });
});

exports.invitePeople = asyncHandler(async (req, res, next) => {
  const players = req.body.players;
  const temp = [];

  for (let player of players) {
    console.log(player);
    const user = await User.findOne({ email: player });
    temp.push(user.id);

    const mailOptions = {
      subject: "Invitation to EBC darft-series league",
      to: player,
      from: process.env.GOOGLE_EMAIL,
    };

    const templateOptions = {
      templateName: "invitation",
    };

    const mail = new Email(mailOptions, templateOptions);
    await mail.send();
  }

  const bannedPok = req.body.bannedPokemon;
  const pokeArray = [];
  for (let pokemon of bannedPok) {
    const { species, sticker, cp, isShadowed } = await Pokemon.findOne({
      pokemon,
    });
    pokeArray.push({ species, cp, sticker, isShadowed });
  }
  const league = await League.findByIdAndUpdate(req.params.id, {
    players: temp,
    bannedPokemons: pokeArray,
  });
  res.status(200).json({
    status: "success",
    message: "People Invited successfully!",
    league,
  });
});

exports.getAllLeagues = asyncHandler(async (req, res) => {
  const leagues = await League.find();
  res.status(200).json({
    status: "success",
    data: { leagues },
  });
});

exports.getLeague = asyncHandler(async (req, res) => {
  const league = await League.findById(req.params.id).populate("players");
  res.status(200).json({
    status: "success",
    data: { league },
  });
});

exports.updateLeague = asyncHandler(async (req, res) => {
  const league = await League.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "league updated successfully",
    data: { league },
  });
});

exports.deleteLeague = asyncHandler(async (req, res) => {
  await League.findByIdAndDelete(req.params.id);
  res.status(204).json({
    status: "league successfully deleted",
    data: null,
  });
});
// Join a league
exports.joinLeague = asyncHandler(async (req, res) => {
  const league = await League.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { players: req.body.player } },
    { new: true }
  );
  res.status(200).json({
    status: "success",
    data: { league },
  });
});

// Select banned Pokemon for a league
exports.selectBannedPokemon = asyncHandler(async (req, res) => {
  const league = await League.findByIdAndUpdate(
    req.params.id,
    // { $push: { "players.$[player].banned_pokemon": req.body.banned_pokemon } },
    // { arrayFilters: [{ "player._id": req.body.player_id }], new: true }
    { $push: { bannedPokemons: req.body.bannedPokemons } }
  );
  res.status(200).json(league);
});

// Select participating Pokemon for a league
exports.selectParticipatingPokemon = asyncHandler(async (req, res) => {
  const league = await League.findById(req.params.id).populate("players");
  res.status(200).json(league);
});

// Handle incoming chat messages
exports.handleChatMessage = async (io, socket, msg) => {
  console.log("message: " + msg);
  io.emit("chat message", msg);

  // Update the tournament chat with the new message
  const tournamentId = msg.tournamentId;
  const senderId = msg.senderId;
  const message = msg.message;

  const tournament = await Tournament.findByIdAndUpdate(
    tournamentId,
    { $push: { chat: { message, sender: senderId } } },
    { new: true }
  ).populate("players", "username");

  // Get the updated chat messages for the tournament
  const chat = tournament.chat;
  io.emit("tournament chat", { chat });
};

// Update player stats when a match is played
exports.playMatch = asyncHandler(async (req, res) => {
  const matchId = req.params.id;
  const match = await Match.findById(matchId);

  // Update player stats
  const winnerId = match.winner;
  const loserId = match.loser;

  const winner = await User.findByIdAndUpdate(
    winnerId,
    { $inc: { "profile.stats.wins": 1 } },
    { new: true }
  );
  const loser = await User.findByIdAndUpdate(
    loserId,
    { $inc: { "profile.stats.losses": 1 } },
    { new: true }
  );

  // Update ranks
  const users = await User.find().sort({ "profile.stats.rating": -1 });
  let rank = 1;
  let prevRating = users[0].profile.stats.rating;
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (user.profile.stats.rating !== prevRating) {
      rank = i + 1;
      prevRating = user.profile.stats.rating;
    }
    await User.findByIdAndUpdate(
      user._id,
      { "profile.stats.rank": rank },
      { new: true }
    );
  }

  // Generate leaderboard
  const regional = await User.find()
    .sort({ "profile.stats.regionalRank": 1 })
    .limit(20);
  const worldwide = await User.find()
    .sort({ "profile.stats.worldwideRank": 1 })
    .limit(20);
  const continental = await User.find()
    .sort({ "profile.stats.continentalRank": 1 })
    .limit(20);

  io.emit("leaderboard", { regional, worldwide, continental });

  res.status(200).json({
    status: "success",
    data: { winner, loser },
  });
});

// Get leaderboard

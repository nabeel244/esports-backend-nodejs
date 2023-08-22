const asyncHandler = require("../utils/asyncHandler");
const Tournament = require("../models/tournamentModel");
const factory = require("../controllers/factoryController");
const { ErrorHandler } = require("../utils/errorHandlers");
const User = require("../models/userModel");
const Match = require("../models/matchModel");
const Team = require("../models/teamModel");
const Pokemon = require("../models/pokemonModel");
const shuffle = require("../utils/shuffle");
const multer = require("multer");
const Season = require("../models/seasonsModel");
const League = require("../models/leagueModel");
const { codeGenerator } = require("../utils/codeGenerator");
const Product = require("../models/productModel");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/tournaments");
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split("/")[1];
    const filename = `${
      file.originalname.split(".")[0]
    }-${codeGenerator()}.${ext}`;
    cb(null, filename);
  },
});
const multerUpload = multer({ storage: storage });
exports.upload = multerUpload.fields([
  { name: "logo", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

exports.createMatch = asyncHandler(async (req, res, next) => {
  req.body.tournament = req.params.id;

  const d = new Date();
  const endTime = d.getTime(req.body.endTime);
  const startTime = d.getTime(req.body.startTime);
  req.body.endTime = endTime;

  if (req.body.startTime) req.body.startTime = startTime;

  const match = await Match.create(req.body);

  await Tournament.findByIdAndUpdate(req.params.id, {
    $push: { matches: match.id },
  });

  res.status(201).json({
    status: "success",
    message: "Match created successfully!",
    data: match,
  });
});

exports.createTournament = asyncHandler(async (req, res, next) => {
  const { month, year, day } = req.body.date;
  const { hr, minute, meridiem } = req.body.time;
  const { league } = req.body;
  const date = new Date(year, month - 1, day, hr, minute);

  // Replace "AM" with "PM" or vice versa using conditional operator

  const localeStringDate = date.toLocaleString();
  const time = localeStringDate.trim().split(",")[1]; // select time from date 3:30 AM

  const images = [];
  req.files.images.forEach((image) => images.push(image.filename));
  req.body.images = images;

  req.body.startDate = localeStringDate.split(",")[0];
  req.body.startTime = time.trim().split(":00")[0] + " " + meridiem; // attach the merideim from the req body

  const { concluded, teams } = req.body;
  if (concluded || teams)
    return next(new ErrorHandler("Sorry you can't add teams"));

  const tournament = await Tournament.create(req.body);

  await League.findOneAndUpdate(
    { leagueType: league },
    { $push: { tournaments: tournament.id } }
  );

  const product = await Product.create({
    name: tournament.name,
    subCategory: "nft",
    images: images,
    thumbnail: tournament.images[0],
    price: 10,
    description: `Rsvp code for ${tournament.name}`,
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    owner: { name: req.user.name },
    category: "all",
  });
  console.log(product);

  res.json({
    status: "success",
    message: "Tournament Created Successfully!",
    data: tournament,
  });
});

exports.checkInTournament = asyncHandler(async (req, res, next) => {
  const tournamentId = req.params.id;
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament)
    return next(new ErrorHandler("The tournament was not found."));

  if (tournament.started)
    return next(
      new ErrorHandler(
        "Tournament is started please come later when new one starts"
      )
    );

  // Filter the rsvpCode array in tournamentModel
  rsvpCodes.forEach((rsvp) => {
    codeExists =
      rsvp.userId.toHexString() === req.user.id &&
      rsvp.code === req.body.rsvpCode;
  });

  // if the doesn't codeExist in the array, thrrow error
  if (!codeExists) return next(new ErrorHandler("Invalid RSVP Code"));

  const user = await User.findByIdAndUpdate(req.user.id, {
    $push: { currentTournaments: tournamentId },
  });

  // Add participant along with favPokemon to tournament
  const favPokemon = user.favPokemon;
  const participant = { userId: req.user.id };
  tournament.participants.push(participant);
  await tournament.save();

  res.json({
    status: "success",
    message: "You have successfully checked-in to the tournament.",
    data: tournament,
  });
});

// Remove participant from tournament
exports.leaveTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findByIdAndUpdate(
    req.params.id,
    { $pull: { participants: { _id: req.user.id } } },
    { new: true }
  ).populate("participants");

  if (!tournament)
    return res.status(404).json({ message: "Tournament not found" });

  res.status(200).json({ message: "You have left the tournament", tournament });
});

exports.currentTournaments = asyncHandler(async (req, res) => {
  const tournaments = await Tournament.find({ started: true })
    .populate("matches")
    .populate("participants");
  res.status(200).json({
    status: "success",
    message: "Current Tournament",
    tournaments,
  });
});

// Get all upcoming tournaments
exports.upcomingTournaments = asyncHandler(async (req, res) => {
  const currentDate = new Date().toLocaleDateString();
  const tournaments = await Tournament.find({
    startDate: { $gte: currentDate },
  })
    .sort("startDate")
    .limit(4);

  res.status(200).json({
    status: "success",
    message: "Upcomming Tournaments",
    upcomingTournaments: tournaments,
  });
});

// Get all concluded tournaments
exports.concludedTournaments = asyncHandler(async (req, res) => {
  const tournaments = await Tournament.find({ isConcluded: true })
    .populate("matches")
    .exec();

  res.status(200).json({
    status: "success",
    message: "All Concluded Tournament",
    data: tournaments,
  });
});

exports.joinTournament = asyncHandler(async (req, res, next) => {
  const tournament = await Tournament.findById(req.params.id);
  const user = await User.findById(req.user.id);
  const { rsvpCodes } = tournament;
  let pokemonTeam = [];
  let maxCp, codeExists;

  if (!tournament) return next(new ErrorHandler("Tournament not found", 404));

  // Filter the rsvpCode array in tournamentModel
  rsvpCodes.forEach((rsvp) => {
    codeExists =
      rsvp.userId.toHexString() === req.user.id &&
      rsvp.code === req.body.rsvpCode;
  });

  // if the doesn't codeExist in the array, thrrow error
  if (!codeExists) return next(new ErrorHandler("Invalid RSVP Code"));

  if (!req.body.isAgree)
    return next(
      new ErrorHandler("You must agree to the tournament rules to join")
    );

  // validate pokemons cp values according to league
  const league = tournament.league.toLowerCase();
  req.body.league = league;

  if (league === "great") maxCp = 1500;
  else if (league === "ultra-great") maxCp = 2500;

  const index = req.body.loadTeam; // loadTeam is number in the body between 0 - 2
  // Load team from user profile if the user wants
  if (maxCp && req.body.pokemon.some((p) => p.cp > maxCp)) {
    return next(
      new ErrorHandler(
        `Some of your Pokémon exceed the maximum CP limit of ${maxCp} for this league`,
        401
      )
    );
  }

  if (req.body.pokemon.length !== 6 && req.body.pokemon.length !== 8)
    return next(
      new ErrorHandler("Your team must have exactly 6 or 8 Pokémons")
    );

  req.body.logo = req.file.filename;
  if (index) {
    const loadTeam = user.teamsPresets[index];
    pokemonTeam = loadTeam;
  } else {
    for (let pokemon of req.body.pokemon) {
      const pok = await Pokemon.find({
        species: pokemon.species,
        cp: pokemon.cp,
        isShadowed: pokemon.isShadowed,
      });
      pokemonTeam.push(pok[0].id);
    }
  }

  if (pokemonTeam.length < 6)
    return next(
      new ErrorHandler("Your team must have exactly 6 or 8 Pokémons")
    );

  // Create new team in team Schema
  const newTeam = await Team.create({
    pokemon: pokemonTeam,
    logo: req.body.logo,
    tournament: req.params.id,
    user: req.user.id,
    league: req.body.league,
    pokemonCount: req.body.pokemonCount,
    tts: {
      highScore: req.body.tts.highScore,
      minScore: req.body.tts.minScore,
    },
  });
  const newTournament = await Tournament.findByIdAndUpdate(req.params.id, {
    $push: {
      teams: newTeam.id,
      participants: { userId: req.user.id, favPokemon: user.favPokemon },
    },
  });

  const userUpdated = await User.findByIdAndUpdate(req.user.id, {
    $push: {
      teamsPresets: newTeam.id,
      currentTournaments: newTournament.id,
    },
  });

  const leagueType = await League.findOneAndUpdate({
    leagueType: tournament.league,
    $push: { players: req.user.id },
  });

  res.status(200).json({
    success: true,
    message: "Joined tournament",
    newTournament,
    user: userUpdated,
    leaguePlayers: leagueType,
  });
});

exports.publicTournamentMatches = asyncHandler(async (req, res, next) => {
  const tournament = await Tournament.findById(req.params.id);
  res.json({ matches: tournament.matches });
});

// for publicTournamentMatches
// exports.publicTournamentMatches = asyncHandler(async (req, res) => {
//   const tournament = await Tournament.findById(req.params.id)
//     .populate({
//       path: "matches",
//       populate: [
//         { path: "player1", select: "name email" },
//         { path: "player2", select: "name email" },
//         { path: "pokemon1.species", select: "name" },
//         { path: "pokemon2.species", select: "name" },
//       ],
//     })
//     .populate({
//       path: "nextMatch",
//       populate: [
//         { path: "player1", select: "name email" },
//         { path: "player2", select: "name email" },
//         // { path: "pokemon1.species", select: "name cp sticker" },
//         // { path: "pokemon2.species", select: "name cp sticker" },
//       ],
//     });

//   if (!tournament) return new ErrorHandler("Tournament not found", 404);

//   let matches = tournament.matches.map((match) => {
//     return {
//       id: match._id,
//       player1: {
//         username: match.player1.name,
//         email: match.player1.email,
//         pokemon: {
//           species: match.pokemon1.species,
//           cp: match.pokemon1.cp,
//           sticker: match.pokemon1,
//         },
//       },
//       player2: {
//         username: match.player2.name,
//         email: match.player2.email,
//         pokemon: {
//           species: match.pokemon2.species,
//           cp: match.pokemon2.cp,
//           sticker: match.pokemon2,
//         },
//       },
//       winner: match.winner,
//       startTime: match.startTime,
//       endTime: match.endTime,
//     };
//   });

//   const searchQuery = req.query.search;
//   if (searchQuery) {
//     matches = matches.filter((match) => {
//       const player1Username = match.player1.name.toLowerCase();
//       const player2Username = match.player2.name.toLowerCase();
//       const searchUsername = searchQuery.toLowerCase();
//       return (
//         player1Username.includes(searchUsername) ||
//         player2Username.includes(searchUsername)
//       );
//     });
//   }

//   const nextMatch = tournament.nextMatch
//     ? {
//         id: tournament.nextMatch._id,
//         player1: {
//           username: tournament.nextMatch.player1.name,
//           email: tournament.nextMatch.player1.email,
//           pokemon: {
//             species: tournament.nextMatch.pokemon1.species.name,
//             cp: tournament.nextMatch.pokemon1.cp,
//           },
//         },
//         player2: {
//           username: tournament.nextMatch.player2.name,
//           email: tournament.nextMatch.player2.email,
//           pokemon: {
//             species: tournament.nextMatch.pokemon2.species.name,
//             cp: tournament.nextMatch.pokemon2.cp,
//           },
//         },
//         startTime: tournament.nextMatch.startTime,
//       }
//     : null;

//   res.status(200).json({
//     status: "success",
//     data: {
//       matches,
//       nextMatch,
//     },
//   });
// });

exports.getTournamentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tournament = await Tournament.findById(id)
    .populate({
      path: "participants",
      populate: [{ path: "userId" }],
    })
    .populate({
      path: "teams",
      populate: [{ path: "user", select: "name info.country profilePhoto" }],
    })
    .populate("matches");
  res.status(200).json({
    status: "succes",
    mesage: "Single tournament",
    tournament,
  });
});

exports.addParticipants = asyncHandler(async (req, res) => {
  const { tournamentId, participants } = req.body;
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    return res.status(404).json({ message: "Tournament not found" });
  }
  for (let participant of participants) {
    const user = await User.findOne({
      invitationCode: participant.invitationCode,
    });

    if (!user) return next(new ErrorHandler("User not found", 404));

    tournament.participants.push({
      user: user._id,
      favPokemon: participant.favPokemon,
    });
  }
  await tournament.save();
  res.status(200).json({ message: "Participants added successfully" });
});

// this will be a private tournaments where three matches will be played
exports.submitOutcomes = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { outcomes } = req.body;
  req.body.outcomes.userId = req.user.id;
  const tournament = await Tournament.findByIdAndUpdate(
    id,
    {
      $push: { outcomes },
    },
    { new: true }
  );
  res.json({
    status: "succes",
    message: "Outcome submitted succesffuly!",
    outcomes: tournament.outcomes,
  });
});

exports.reportOutcomes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tournament = await Tournament.findById(id)
    .populate("teams")
    .populate("outcomes");
  res.status(200).json({
    status: "success",
    message: "Tournament matches outcome",
    data: tournament,
  });
});

exports.startTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return next(new ErrorHandler("Tournament Not found", 404));

  if (!tournament.started) {
    await Tournament.findByIdAndUpdate(req.params.id, { started: true });
  }

  if (tournament.participants.length < 2) {
    return next(
      new ErrorHandler(
        "At least two participants required to start the tournament"
      )
    );
  }
  for (let participant of tournament.participants) {
    participant.pokemonChecked = false;
  }
  tournament.started = true;
  tournament.rounds = [];

  const shuffledParticipants = shuffle(tournament.participants);
  const numberOfRounds = 5;
  const numberOfMatchesPerRound = shuffledParticipants.length / 2;

  for (let i = 0; i < numberOfRounds; i++) {
    const roundMatches = [];
    for (let j = 0; j < numberOfMatchesPerRound; j++) {
      const match = {
        player1: shuffledParticipants[j * 2]._id,
        player2: shuffledParticipants[j * 2 + 1]._id,
        score1: null,
        score2: null,
      };
      roundMatches.push(match);
    }
    tournament.rounds.push(roundMatches);
  }
  await tournament.save();

  // Show the tournament schedule to the users
  console.log("Tournament Schedule:");
  for (let i = 0; i < numberOfRounds; i++) {
    console.log(`Round ${i + 1}:`);
    for (let j = 0; j < numberOfMatchesPerRound; j++) {
      const match = tournament.rounds[i][j];
      const player1 = await User.findById(match.player1);
      const player2 = await User.findById(match.player2);
      console.log(`${player1.username} vs ${player2.username}`);
    }
    console.log("");
  }

  // Wait for users to update their pokemon before starting the tournament
  for (let round of tournament.rounds) {
    await Promise.all(
      round.map(async (match) => {
        const player1 = await User.findById(match.player1);
        const player2 = await User.findById(match.player2);
        if (!player1.pokemonChecked || !player2.pokemonChecked) {
          throw new Error(
            "All players must check their pokemon before starting the tournament"
          );
        }
      })
    );
  }

  // Start the tournament rounds
  for (let round of tournament.rounds) {
    console.log(`Round ${tournament.rounds.indexOf(round) + 1}:`);
    for (let match of round) {
      const player1 = await User.findById(match.player1);
      const player2 = await User.findById(match.player2);
      const score1 = Math.floor(Math.random() * 6);
      const score2 = Math.floor(Math.random() * 6);
      match.score1 = score1;
      match.score2 = score2;
      console.log(
        `${player1.username} (${score1}) vs ${player2.username} (${score2})`
      );
    }
    console.log("");
    await tournament.save();

    // Show the final scores for each participant
    console.log("Final Scores:");
    for (let participant of tournament.participants) {
      let score = 0;
      for (let round of tournament.rounds) {
        for (let match of round) {
          if (match.player1.toString() === participant._id.toString()) {
            score += match.score1;
          } else if (match.player2.toString() === participant._id.toString()) {
            score += match.score2;
          }
        }
      }
      console.log(`${participant.username}: ${score}`);
    }
  }
  console.log("");
});

// Get details of a tournament
exports.getTournamentDetails = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findById(req.params.id)
    .populate({
      path: "players",
      select: "username battles wins losses rank",
    })
    .select("-matches");
  if (!tournament) {
    return res.status(404).json({ message: "Tournament not found" });
  }
  res.status(200).json(tournament);
});

// Get players in a tournament
exports.getTournamentPlayers = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findById(req.params.id).populate({
    path: "participants",
    select: "username favoritePokemon",
  });
  if (!tournament) {
    return res.status(404).json({ message: "Tournament not found" });
  }
  res.status(200).json(tournament.players);
});

// Get latest match

exports.latestMatch = asyncHandler(async (req, res, next) => {
  const { tournamentId } = req.params;
  const matches = (await Tournament.findById(tournamentId)).matches;
  res.json({
    status: "success",
    message: "Latest match in specific tournament",
    match: matches,
  });
});

// Get the next match of the current player
exports.getNextMatch = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  console.log(currentUserId);
  const { tournamentId } = req.params;
  const nextMatch = await Match.findOne({
    tournament: tournamentId,
    $or: [{ player1: currentUserId }, { player2: currentUserId }],
  })
    .populate({ path: "player1", select: "name favPokemon teamsPresets" })
    .populate({ path: "player2", select: "name favPokemon teamsPresets" })
    .populate({ path: "tournament", select: "name" });
  // const match = await Match.findOne({
  //   $or: [{ player1: currentUserId }, { player2: currentUserId }],
  //   // winner: null,
  // })
  //   .populate("player1", "name email favPokemon teamsPresets")
  //   .populate("player2", "name email favPokemon teamsPresets");
  // if (!match) {
  //   return res.status(404).json({
  //     success: false,
  //     message: "No match found",
  //   });
  // }
  res.status(200).json({
    success: true,
    nextMatch,
  });
  // console.log(currentUserId, match.player2.id);
  // let currentPlayer = "player1";
  // if (match.player2 === currentUserId) {
  //   currentPlayer = "player2";
  // }
  // const nextMatch = {
  //   id: match._id,
  //   [currentPlayer]: {
  //     name: req.user.name,
  //     email: req.user.email,
  //     pokemon: {
  //       species: match[`pokemon${currentPlayer.slice(-1)}`].species,
  //       cp: match[`pokemon${currentPlayer.slice(-1)}`].cp,
  //     },
  //   },
  //   [currentPlayer === "player1" ? "player2" : "player1"]: {
  //     name: match[currentPlayer === "player1" ? "player2" : "player1"].name,
  //     email: match[currentPlayer === "player1" ? "player2" : "player1"].email,
  //     favPokemon: {
  //       species:
  //         match[`pokemon${currentPlayer === "player1" ? "2" : "1"}`].species,
  //       cp: match[`pokemon${currentPlayer === "player1" ? "2" : "1"}`].cp,
  //     },
  //   },
  //   startTime: match.startTime,
  // };
  // res.status(200).json({
  //   success: true,
  //   nextMatch: match,
  // });
});

exports.getFeaturedEvents = asyncHandler(async (req, res) => {
  const featuredMatches = await Match.find({ isFeatured: true })
    .populate({
      path: "player1",
      select: "name profilePhoto",
    })
    .populate({
      path: "player2",
      select: "name profilePhoto",
    })
    .populate({ path: "tournament", select: "name league" });
  res.json({
    status: "success",
    message: "Featured Events",
    featuredMatches,
  });
});

exports.addFriend = asyncHandler(async (req, res, next) => {
  const { friendCode } = req.body.info;
  const isUser = await User.findOne({ info: { friendCode: friendCode } });
  if (!isUser) return next(new ErrorHandler("Invalid Code"));
  const udpatedUser = await User.findByIdAndUpdate(req.user.id, {
    $push: { friendList: isUser.id },
  });
  res.status(200).json({
    status: "success",
    message: "User added",
    user: udpatedUser.friendList,
  });
});

exports.pinTournament = asyncHandler(async (req, res, next) => {
  const { tournamentId } = req.params;
  const pinTournament = await Tournament.findByIdAndUpdate(
    tournamentId,
    {
      isPined: true,
    },
    { new: true }
  );
  res.json({
    status: "Success",
    message: "Tournament Pinned Succesffully!",
    pinTournament,
  });
});

exports.unpinTournament = asyncHandler(async (req, res, next) => {
  const { tournamentId } = req.params;
  const unpinTournament = await Tournament.findByIdAndUpdate(
    tournamentId,
    {
      isPined: false,
    },
    { new: true }
  );
  res.json({
    status: "Success",
    message: "Tournament Pinned Succesffully!",
    unpinTournament,
  });
});

exports.getPinedTournament = asyncHandler(async (req, res, next) => {
  const { tournamentId } = req.params;
  const pinTournaments = await Tournament.find({ isPined: true });
  res.json({
    status: "Success",
    message: "Tournament Pinned Succesffully!",
    results: pinTournaments.length,
    pinTournaments,
  });
});
// module.exports = router;

exports.updateTournament = factory.updateById(Tournament);
exports.deleteTournament = factory.deleteById(Tournament);
exports.getAllTournaments = factory.getAll(Tournament);

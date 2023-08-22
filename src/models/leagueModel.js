const mongoose = require("mongoose");

const leagueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A league must have a name"],
    trim: true,
    maxlength: [40, "A league name must have less or equal to 40 characters"],
    minlength: [3, "A league name must have more or equal to 3 characters"],
  },

  // League Type which league is this.
  leagueType: {
    type: String,
    enum: ["great", "great-ultra", "master"],
    required: [true, "A league must have a type"],
    unique: true,
  },

  // Players in this league.
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      select: "+teamsPresets",
    },
  ],

  // Rounds in the tournament
  rounds: {
    type: Number,
    tournaments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tournament" }],
  },

  // Admin will select banned pokemons the users wouldn't be
  // able to play those pokemons in the tournament.
  bannedPokemons: [
    {
      cp: Number,
      species: String,
      isShadowed: Boolean,
      sticker: String,
    },
  ],

  // MaxCapvalues for each league as said in the video
  // Each league has its own limitations of cp value
  maxCpValues: {
    great: {
      type: Number,
      max: 1500,
    },
    ultra: {
      type: Number,
      max: 2500,
    },
    masters: {
      type: Number,
    },
  },

  // This will be tournaments in this league
  //when the admin selects a league it will be added here automatically.
  tournaments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tournament" }],

  // This is the chat array here chat message will be stored.
  chat: [
    {
      message: String,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      createdAt: {
        type: Date,
        default: Date.now(),
      },
    },
  ],
});

const League = mongoose.model("League", leagueSchema);
module.exports = League;

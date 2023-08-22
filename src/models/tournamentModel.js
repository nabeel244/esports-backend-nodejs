const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    rounds: {
      type: Number,
      default: 5,
    },
    startDate: {
      type: String,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },

    allowTeams: {
      type: Boolean,
      required: true,
    },
    nextMatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    region: {
      type: String,
      enum: ["Asia", "Europe", "Africa", "North-America", "South-America"],
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    division: {
      type: String,
      enum: ["Elite", "Ace", "Challenger", "Rival", "Trainee"],
      required: true,
    },
    roundLimit: {
      type: Number,
      required: true,
      min: 1,
      max: 24,
    },
    isRemote: {
      type: Boolean,
      required: true,
    },
    eventTitle: {
      type: String,
      required: true,
    },
    showOnMap: {
      type: Boolean,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    eventDetails: {
      type: String,
      required: true,
    },
    info: {
      type: String,
      required: true,
    },
    league: {
      type: String,
      required: true,
      enum: ["great", "ultra-great", "master"],
    },
    bracket: {
      type: String,
      required: true,
    },
    isConcluded: {
      type: Boolean,
      default: false,
    },

    rsvpCodes: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
        code: String,
      },
    ],
    isPined: {
      type: Boolean,
      default: false,
    },
    images: [
      {
        type: String,
        required: [true, "Please upload image"],
      },
    ],
    // isAgree: { type: String, required: true },
    teams: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Teams",
      },
    ],

    isPrivate: {
      type: Boolean,
      default: false,
      required: true,
    },
    invitationCode: {
      type: String,
      required: function () {
        return this.isPrivate;
      },
    },
    participants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
        favPokemon: {
          sticker: String,
          cp: Number,
          species: String,
          isShadowed: Boolean,
        },
      },
    ],
    started: {
      type: Boolean,
      default: false,
    },
    round: [
      {
        type: Number,
        default: 1,
      },
    ],
    // entryFee: {
    //   type: Number,
    //   required: true,
    // },
    maxParticipants: {
      type: Number,
      //  required: true,
    },

    completed: {
      type: Boolean,
      default: false,
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      default: null,
    },
    matches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Match" }],
    outcomes: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
        matchId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
        outcome: { type: String },
      },
    ],
    rules: [{ type: String }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tournamentSchema.pre(/^find/, function (next) {
  this.populate({
    path: "matches",
    populate: [
      { path: "player1", select: "name" },
      { path: "player2", select: "name" },
    ],
  }).populate({
    path: "nextMatch",
  });
  next();
});

const Tournament = mongoose.model("Tournament", tournamentSchema);
module.exports = Tournament;

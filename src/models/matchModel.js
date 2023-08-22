const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    round: { type: Number, required: true, min: 1, max: 6 },
    matchName: { type: String, required: true },
    matchLink: { type: String },

    player1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    player2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    pokemon1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pokemons",
    },
    pokemon2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pokemons",
    },

    player1Score: { type: Number, required: true, default: 0 },
    player2Score: { type: Number, required: true, default: 0 },

    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      enum: ["player1", "player2", "tie"],
    },
    loser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now(),
    },
    startDate: { type: String, required: true },
    endTime: {
      type: Date,
    },
    isFeatured: {
      type: Boolean,
    },
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

matchSchema.pre(/^find/, function (next) {
  this.populate("pokemon1").populate("pokemon2");
  next();
});

const Match = mongoose.model("Match", matchSchema);
module.exports = Match;

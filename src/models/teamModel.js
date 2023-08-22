const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  pokemon: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pokemons",
    },
  ],
  logo: { type: String, required: true },
  pokemonCount: { type: Number, required: true },
  tts: {
    minScore: { type: Number, required: true },
    highScore: { type: Number, required: true },
  },

  league: {
    type: String,
    required: true,
    enum: ["master", "great", "great-ultra"],
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament" },
});

teamSchema.pre(/^find/, function (next) {
  this.populate("pokemon");
  next();
});

const Team = mongoose.model("Teams", teamSchema);
module.exports = Team;

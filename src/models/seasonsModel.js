const mongoose = require("mongoose");
const seasonSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  tournaments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tournaments" }],
  leagues: [{ type: mongoose.Schema.Types.ObjectId, ref: "Leagues" }],
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  description: { type: String, required: true },
});

const Season = mongoose.model("Seasons", seasonSchema);
module.exports = Season;

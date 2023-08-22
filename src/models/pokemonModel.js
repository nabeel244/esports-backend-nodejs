const mongoose = require("mongoose");
const slugify = require("slugify");

const pokemonSchema = new mongoose.Schema({
  // name: { type: String, required: true },
  species: { type: String, required: true },
  cp: { type: Number, required: true },
  isShadowed: { type: Boolean },
  sticker: { type: String, required: true },
  slug: { type: String },
});

pokemonSchema.pre("save", function (next) {
  this.slug = slugify("species");
  next();
});

const Pokemon = mongoose.model("Pokemons", pokemonSchema);
module.exports = Pokemon;

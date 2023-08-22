const asyncHandler = require("../utils/asyncHandler");
const factory = require("../controllers/factoryController");
const { ErrorHandler } = require("../utils/errorHandlers");
const Pokemon = require("../models/pokemonModel");
const multer = require("multer");
const { codeGenerator } = require("../utils/codeGenerator");

const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, "public/pokemons/");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    const filename = `${
      file.originalname.split(".")[0]
    }-${codeGenerator()}.${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });
exports.uploadSticker = upload.single("sticker");

exports.uploadPokemon = asyncHandler(async (req, res, next) => {
  req.body.sticker = req.file.filename;
  const pokemon = await Pokemon.create(req.body);
  res.status(201).json({
    status: "success",
    message: `Pokemon "${req.body.species}" along with sticker uploaded successfully!`,
    data: pokemon,
  });
});

exports.getPokemon = asyncHandler(async (req, res, next) => {
  const pokemon = await Pokemon.findById(req.params.id);
  res.status(200).json({
    status: "success",
    message: `Pokemon "${pokemon.species}" along with sticker retrived successfully!`,
    data: pokemon,
  });
});

exports.getAllPokemons = factory.getAll(Pokemon);
exports.updatePokemon = factory.updateById(Pokemon);
exports.deletePokemon = factory.deleteById(Pokemon);

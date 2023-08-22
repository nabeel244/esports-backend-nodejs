const asyncHandler = require("../utils/asyncHandler");

const Teams = require("../models/teamModel");
const Matches = require("../models/matchModel");
const Pokemon = require("../models/pokemonModel");

exports.stat1 = asyncHandler(async (req, res, next) => {
  const matches = await Matches.aggregate([
    {
      $lookup: {
        from: "pokemons", // The collection to join (assuming the name is 'pokemons')
        let: {
          pokemon1Id: "$pokemon1",
          pokemon2Id: "$pokemon2",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ["$_id", "$$pokemon1Id"] },
                  { $eq: ["$_id", "$$pokemon2Id"] },
                ],
              },
            },
          },
        ],
        as: "pokemonData",
      },
    },
    {
      $unwind: "$pokemonData",
    },
    {
      $group: {
        _id: "$pokemonData.species",
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        species: { $push: { species: "$_id", count: "$count" } },
      },
    },
    {
      $unwind: "$species",
    },
    {
      $project: {
        _id: 0,
        species: "$species.species",
        usage: "$species.count",
        percentage: {
          $multiply: [
            { $divide: ["$species.count", { $sum: "$species.count" }] },
            100,
          ],
        },
      },
    },
    {
      $sort: { usage: -1 },
    },
  ]);
  res.json(matches);
});

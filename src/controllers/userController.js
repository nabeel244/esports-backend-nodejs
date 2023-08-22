const path = require("path");

const multer = require("multer");
const jwt = require("jsonwebtoken");

const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/userModel");
const { ErrorHandler } = require("../utils/errorHandlers");
const factory = require("./factoryController");
const { codeGenerator } = require("../utils/codeGenerator");

const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, "public/users/");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    const filename = `${
      file.originalname.split(".")[0]
    }-${codeGenerator()}.${ext}`;
    cb(null, filename);
  },
});

const multerUpload = multer({ storage });
exports.upload = multerUpload.single("profilePhoto");

exports.uploadImages = asyncHandler(async (req, res, next) => {
  req.body.profilePhoto = req.file.filename;
  const photo = req.body.profilePhoto;
  console.log(req.user.id, photo);
  const user = await User.findByIdAndUpdate(req.user.id, {
    profilePhoto: photo,
  });
  res.status(200).json({
    status: "success",
    message: "photo uploaded successfully!",
    data: user,
  });
});

exports.createUserProfile = asyncHandler(async (req, res, next) => {
  const { stats, trophies, currentTournaments } = req.body;

  if (stats || trophies || currentTournaments) {
    return next(
      new ErrorHandler(
        "Sorry, You can't add or update stats, trophies and tournaments entered",
        401
      )
    );
  }

  req.body.info.email = req.user.email;
  const user = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
  });
  res.status(201).json({
    status: "success",
    data: user,
  });
});

exports.getCurrentUser = asyncHandler(async (req, res, next) => {
  const id = req.user.id;
  const user = await User.findById(id);
  res.status(200).json({
    status: "success",
    message: "Current User profile",
    data: user,
  });
});

exports.leaderboard = async (req, res) => {
  const user = await User.findById(req.user.id);
  const regional = await User.find({ "info.region": user.info.region })
    .sort({ "stats.wins": 1 })
    .limit(20);

  const worldwide = await User.find().sort({ "stats.wins": 1 }).limit(20);

  const continental = await User.find().sort({ "stats.wins": 1 }).limit(20);

  res.status(200).json({
    status: "success",
    results: {
      regionalResults: regional.length,
      ontinentalResults: continental.length,
      worldwideResults: worldwide.length,
    },
    data: { regional, worldwide, continental },
  });
};

exports.nationalLeaderBoard = asyncHandler(async (req, res, next) => {
  const national = await User.find({ "info.location": req.params.country })
    .sort({ "stats.nationalRank": 1 })
    .limit(20);

  res.json({
    results: national.length,
    message: "National Leaderboard",
    national,
  });
});

exports.getUser = factory.getById(User);
exports.updateUser = factory.updateById(User);
exports.getAllUsers = factory.getAll(User);
exports.deleteUser = factory.deleteById(User);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { isEmail } = require("validator");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
  },

  username: {
    type: String,
    required: [true, "Please provide a username"],
    unique: true,
  },

  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: [true, "Email Already Exists"],
    validate: [isEmail, "Please provide a valid email"],
  },

  password: {
    type: String,
    minlength: [8, "Password must be 8 characters"],
    required: [true, "Please provide a password"],
    select: false,
  },

  description: { type: String },
  profilePhoto: {
    type: String,
    default:
      "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
  },
  paypal: { type: String },
  role: {
    type: String,
    required: true,
    enum: ["user", "admin"],
    default: "user",
  },

  socialId: { type: String },

  stats: {
    wins: { type: Number, default: 0 },
    Loses: { type: Number, default: 0 },
    matchesPlayer: { type: Number, default: 0 },
    WLPercentage: { type: Number, default: 0 },
    EBCRank: { type: Number, default: 0 },
    uniqueOpponents: { type: Number, default: 0 },
    achievements: { type: Number, default: 0 },
    trophies: { type: Number, default: 0 },
    nationalRank: { type: Number, default: 0 },
    ranksTournaments: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    rank: { type: Number },
    regionalRank: { type: Number, default: 0 },
    worldwideRank: { type: Number, default: 0 },
    continentalRank: { type: Number, default: 0 },
  },

  metaMaskWallet: { type: String },

  // In the region page update the region field using update current user profile route and also the skills field.
  // There is no need to use another endpoints for these as it will increase api calls unnecessaryly.

  info: {
    location: { type: String },
    region: { type: String }, // region page
    skill: { type: String }, // skills page
    team: { type: String },
    socialLinks: [{ type: String }],
    email: {
      type: String,
      validate: [isEmail, "Invalid Email"],
      trim: true,
    },
    friendCode: {
      type: String,
      maxlength: [6, "Invalid friend code"],
      unique: [true, "Please try again"],
    },
  },

  favPokemon: { type: mongoose.Schema.Types.ObjectId, ref: "Pokemons" },
  currentTournaments: [{ type: mongoose.Types.ObjectId, ref: "Tournament" }],

  trophies: {
    worldWide: [{ type: String }],
    regional: [{ type: String }],
    nationWide: [{ type: String }],
  },

  friendList: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
  ],

  teamsPresets: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teams",
    },
  ],

  isOnline: { type: Boolean },
  // rsvpCode: [
  //   {
  //     tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament" },
  //     tournamentName: { type: String },
  //     code: { type: String },
  //   },
  // ],

  verified: {
    type: Boolean,
    default: false,
  },
});

userSchema.methods.comparePassword = async function (
  currentPassword,
  userPassword
) {
  return await bcrypt.compare(currentPassword, userPassword);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: "Teams",
  //   select: "cp species isShadowed",
  // });
  this.populate({
    path: "teamsPresets",
    select: "cp species isShadowed sticker",
  }).populate({
    path: "favPokemon",
    select: "cp species isShadowed",
  });
  // .populate({
  //   path: "currentTournaments",
  //   select: "name matches",
  // });
  next();
});

const User = mongoose.model("Users", userSchema);
module.exports = User;

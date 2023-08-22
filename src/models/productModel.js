const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  color: {
    type: String,
  },
  size: {
    type: String,
  },
  thumbnail: {
    type: String,
  },
  images: [
    {
      type: String,
      max: 10,
    },
  ],
  price: {
    type: Number,
  },

  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament" },
  tournamentName: { type: String },

  category: {
    type: String,
    required: true,
    enum: ["all", "men", "women", "kids"],
  },
  subCategory: {
    type: String,
    required: true,
    enum: ["t-shirts", "jerseys", "nft", "hoodies", "bags", "hats"],
  },
  countInStock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 255,
  },
  owner: {
    name: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
  },
  deliveryFee: {
    type: Number,
  },
  deliveryEstimate: {
    minimum: {
      unit: { type: String, default: "business_day" },
      value: { type: Number, default: 3 },
    },
    maximum: {
      unit: { type: String, default: "business_day" },
      value: { type: Number, default: 9 },
    },
  },
  slug: { type: String },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

productSchema.pre("save", function (next) {
  this.slug = slugify(this.name);
  next();
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;

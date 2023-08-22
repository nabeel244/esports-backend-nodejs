const mongoose = require("mongoose");

const blogPostSchema = new mongoose.Schema({
  headline: { type: String, minLength: 5, required: true },
  description: { type: String, minLength: 10, required: true },
  date: { type: Date, default: Date.now },
  author: { type: String, required: true },
  title: { type: String, minLength: 6, maxLength: 80 },
  thumbnail: { type: String, required: true },
  blogBody: { type: String, required: true },
  likes: { type: Number, default: 0 },
  images: [{ type: String }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
});

const BlogPost = mongoose.model("Blog", blogPostSchema);
module.exports = BlogPost;

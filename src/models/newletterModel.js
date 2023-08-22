const mongoose = require("mongoose");
const { isEmail } = require("validator");
const newsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    validate: [isEmail, "Please provide valid email"],
    required: [true, "Please provide Email"],
    unique: [true, "Email already subscribed"],
  },

  newLetter: {
    subject: {
      type: String,
    },
    text: {
      type: String,
    },
  },
});

const News = mongoose.model("News", newsSchema);
module.exports = News;

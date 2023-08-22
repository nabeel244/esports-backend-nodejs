const mongoose = require("mongoose");

const contactUsSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3,
    required: [true, "Please provide a name"],
  },
  email: {
    type: String,
    required: [true, "Please provide a valid email"],
  },
  message: {
    type: String,
    minlength: 10,
    required: [true, "Please proivde a proper message"],
  },
});

const ContactUsForm = mongoose.model("ContactUsResponse", contactUsSchema);

module.exports = ContactUsForm;

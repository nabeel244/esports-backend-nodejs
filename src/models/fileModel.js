const mongoose = require("mongoose");
const fileSchema = new mongoose.Schema({
  fines: {
    type: String,
  },

  waiver: {
    type: String,
  },

  rules: [{ type: String }],
});

const File = mongoose.model("Files", fileSchema);
module.exports = File;

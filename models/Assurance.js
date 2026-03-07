const mongoose = require("mongoose");

const assuranceSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  prix: {
    type: Number,
    required: true
  },
  type: {
    type: String
  }
});

module.exports = mongoose.model("Assurance", assuranceSchema);
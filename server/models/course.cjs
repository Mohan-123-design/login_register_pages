var mongoose = require("mongoose");
var courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  trainer: { type: String, default: "" },
  batch: { type: String, default: "" },
  status: { type: String, default: "Active" },
}, { timestamps: true });

module.exports = mongoose.model("Course", courseSchema);
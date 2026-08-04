var mongoose = require("mongoose");
var examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  course: { type: String, default: "" },
  batch: { type: String, default: "" },
  examDate: { type: String, default: "" },
  status: { type: String, default: "Scheduled" },
}, { timestamps: true });

module.exports = mongoose.model("Exam", examSchema);
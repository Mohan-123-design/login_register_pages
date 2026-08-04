var mongoose = require("mongoose");
var assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  batch: { type: String, default: "" },
  course: { type: String, default: "" },
  dueDate: { type: String, default: "" },
  status: { type: String, default: "Pending" }, 
}, { timestamps: true });

module.exports = mongoose.model("Assignment", assignmentSchema);
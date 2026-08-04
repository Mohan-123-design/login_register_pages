var mongoose = require("mongoose");
var certificateSchema = new mongoose.Schema({
  studentEmail: { type: String, required: true },
  courseName: { type: String, default: "" },
  certificateId: { type: String, default: "" },
  issuedDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Certificate", certificateSchema);
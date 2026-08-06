var mongoose = require("mongoose");
var courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, default: "", trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "" },
    trainerEmail: { type: String, default: "" },
    trainerName: { type: String, default: "" },
    batch: { type: String, default: "" },
    duration: { type: String, default: "" },
    startDate: { type: Date, default: null },
    status: { type: String, enum: ["Active", "Archived"], default: "Active" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Course", courseSchema);
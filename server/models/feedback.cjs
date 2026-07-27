var mongoose = require("mongoose");
var feedbackschema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true },
    studentId: { type: String, required: true },
    trainerId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, default: "" },
    tags: {
      type: String,
      enum: ["Excellent", "Good", "Average", "Poor"],
      default: "Good",
    },
  },
  { timestamps: true },
);
feedbackschema.index({ sessionId: 1, studentId: 1 }, { unique: true });
module.exports = mongoose.model("Feedback", feedbackschema);
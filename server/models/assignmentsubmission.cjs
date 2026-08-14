var mongoose = require("mongoose");
var submissionFileSchema = new mongoose.Schema(
  {
    fileName: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
  },
  { _id: false },
);

var assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    studentEmail: { type: String, required: true },
    studentName: { type: String, default: "" },
    answerText: { type: String, default: "" },
    submittedFiles: { type: [submissionFileSchema], default: [] },
    referredLinks: { type: [String], default: [] },
    submittedAt: { type: Date, default: null },
    isLate: { type: Boolean, default: false },
    submissionStatus: {
      type: String,
      enum: ["Not Submitted", "Submitted", "Late"],
      default: "Not Submitted",
    },
    evaluationStatus: {
      type: String,
      enum: ["Pending Evaluation", "Graded"],
      default: "Pending Evaluation",
    },
    totalMarks: { type: Number, default: 0 },
    obtainedMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    grade: { type: String, default: "-" },
    feedback: { type: String, default: "" },
    latePenaltyApplied: { type: Number, default: 0 },
    penaltyWaived: { type: Boolean, default: false },
    gradedBy: { type: String, default: "" },
    gradedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
assignmentSubmissionSchema.index({ assignmentId: 1, studentEmail: 1 }, { unique: true });

module.exports = mongoose.model("AssignmentSubmission", assignmentSubmissionSchema);
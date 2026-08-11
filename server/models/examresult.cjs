var mongoose = require("mongoose");
var examResultSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    studentEmail: { type: String, required: true },
    studentName: { type: String, default: "" },
    totalMarks: { type: Number, default: 0 },
    obtainedMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    grade: { type: String, default: "-" },
    passStatus: { type: String, enum: ["Pass", "Fail"], default: "Fail" },
    completionStatus: {
      type: String,
      enum: ["Not Attempted", "In Progress", "Completed"],
      default: "Not Attempted",
    },
    submittedAt: { type: Date, default: null },
    answers: {
      type: [
        {
          questionIndex: { type: Number, required: true },
          selectedOption: { type: Number, default: -1 },
          _id: false,
        },
      ],
      default: [],
    },
    gradedBy: { type: String, default: "" },
  },
  { timestamps: true },
);
examResultSchema.index({ examId: 1, studentEmail: 1 }, { unique: true });

module.exports = mongoose.model("ExamResult", examResultSchema);
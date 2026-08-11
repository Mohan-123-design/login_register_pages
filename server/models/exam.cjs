var mongoose = require("mongoose");
var questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: { type: [String], default: [] },
    correctOption: { type: Number, default: 0 },
    marks: { type: Number, default: 1 },
  },
  { _id: false },
);
var examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
    courseName: { type: String, default: "" },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", default: null },
    batchName: { type: String, default: "" },
    examDate: { type: Date, required: true },
    duration: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    passingMarks: { type: Number, required: true },
    instructions: { type: String, default: "" },
    questions: { type: [questionSchema], default: [] },
    status: {
      type: String,
      enum: ["Draft", "Published", "Unpublished"],
      default: "Draft",
    },
    createdByEmail: { type: String, default: "" },
    createdByName: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Exam", examSchema);

var mongoose = require("mongoose");
var attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
  },
  { _id: false },
);

var topicSchema = new mongoose.Schema(
  {
    topicText: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false },
);
var assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
    courseName: { type: String, default: "" },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", default: null },
    batchName: { type: String, default: "" },
    description: { type: String, default: "" },
    instructions: { type: String, default: "" },
    totalMarks: { type: Number, required: true },
    dueDate: { type: Date, required: true },
attachments: { type: [attachmentSchema], default: [] },
    referenceLinks: { type: [String], default: [] },
    topics: { type: [topicSchema], default: [] },
        latePenaltyPercent: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Draft", "Published", "Open", "Closed", "Completed"],
      default: "Draft",
    },
    createdByEmail: { type: String, default: "" },
    createdByName: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Assignment", assignmentSchema);
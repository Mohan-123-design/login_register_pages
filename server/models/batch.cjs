var mongoose = require("mongoose");
var batchStudentSchema = new mongoose.Schema(
  {
    studentEmail: { type: String, required: true },
    studentName: { type: String, default: "" },
    allocatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

var batchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, default: "", trim: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
    courseName: { type: String, default: "" },
    trainerEmail: { type: String, default: "" },
    trainerName: { type: String, default: "" },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    schedule: { type: String, default: "" },
    capacity: { type: Number, default: 30 },
    status: {
      type: String,
      enum: ["Upcoming", "Active", "Completed", "Archived"],
      default: "Upcoming",
    },
    students: { type: [batchStudentSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Batch", batchSchema);
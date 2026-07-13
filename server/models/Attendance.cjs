var mongoose = require("mongoose");

var attendanceSchema = new mongoose.Schema(
  {
    userId: String,
    sessionId: String,
    joinTime: Date,
    leaveTime: Date,
    duration: Number,

    studentEmail: String,
    studentName: String,
    date: String,
    markedBy: String,

    status: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Attendance", attendanceSchema);

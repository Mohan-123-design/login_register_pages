var mongoose = require("mongoose");
var certificateSchema = new mongoose.Schema(
  {
    certificateId: { type: String, required: true, unique: true },
    verificationCode: { type: String, required: true, unique: true },
    studentEmail: { type: String, required: true },
    studentName: { type: String, required: true },
    courseId: { type: String, default: "" },
    courseName: { type: String, required: true },
    batch: { type: String, default: "" },
    completionDate: { type: Date, required: true },
    issueDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["Valid", "Revoked"], default: "Valid" },
    issuedByEmail: { type: String, default: "" },
    issuedByName: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Certificate", certificateSchema);
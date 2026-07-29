var mongoose = require("mongoose");
var announcementschema = new mongoose.Schema(
  {
    sessionId: { type: String, default: null },
    batchId: { type: String, default: null },
    senderId: { type: String, required: true },
    senderName: { type: String, default: "" },
    senderRole: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Emergency"],
      default: "Medium",
    },
    targetaudience: {
      type: String,
      enum: ["All", "Batch", "Liveclassroom"],
      required: true,
    },
    isRead: { type: Boolean, default: false },
    readBy: [{ type: String }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }, 
);
announcementschema.index({ sessionId: 1, createdAt: -1 });
announcementschema.index({ batchId: 1, createdAt: -1 });
announcementschema.index({ targetaudience: 1, createdAt: -1 });

module.exports = mongoose.model("Announcement", announcementschema);
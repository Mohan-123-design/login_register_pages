var mongoose = require("mongoose");
var notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  recipientType: {
    type: String,
    required: true,
  },
  batchName: {
    type: String,
    default: "",
  },
  recipientId: {
    type: String,
    default: "",
  },
  senderId: {
    type: String,
    required: true,
  },
  senderRole: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    default: "Medium",
  },
  status: {
    type: String,
    default: "Active",
  },
  readBy: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", notificationSchema);

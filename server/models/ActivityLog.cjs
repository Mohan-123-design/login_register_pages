var mongoose = require("mongoose");
var ActivityLogSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  eventType: {
    type: String,
    required: true,
  },
  actorId: {
    type: String,
    required: true,
  },
  actorName: {
    type: String,
    required: true,
  },
  targetId: {
    type: String,
    required: false,
  },
  targetName: {
    type: String,
    required: false,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

ActivityLogSchema.index({ sessionId: 1, timestamp: -1 });
module.exports = mongoose.model("ActivityLog", ActivityLogSchema);

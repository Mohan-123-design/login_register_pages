var mongoose = require("mongoose");
var recordingViewSchema = new mongoose.Schema(
  {
    recordingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recording",
      required: true,
    },
    viewerEmail: { type: String, required: true },
    viewerRole: { type: String, required: true },
    eventType: { type: String, enum: ["view", "download"], required: true },
    watchDurationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

recordingViewSchema.index({ recordingId: 1, eventType: 1 });
recordingViewSchema.index({ recordingId: 1, viewerEmail: 1 });

module.exports = mongoose.model("RecordingView", recordingViewSchema);
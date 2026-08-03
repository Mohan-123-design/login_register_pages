var mongoose = require("mongoose");

var recordingSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true },
    batchId: { type: String, required: true },
    trainerId: { type: String, required: true },

    title: { type: String, required: true },
    description: { type: String, default: "" },

    videoUrl: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },

    duration: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },

    status: {
      type: String,
      enum: [
        "Pending Upload",
        "Processing",
        "Encoding Completed",
        "Ready",
        "Failed Processing",
      ],
      default: "Pending Upload",
    },

    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    recordingDate: { type: Date, default: Date.now },

    playbackCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    downloadEnabled: { type: Boolean, default: true },

    visibility: {
      type: String,
      enum: ["Public Batch", "Private Trainer"],
      default: "Public Batch",
    },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

recordingSchema.index({ batchId: 1, createdAt: -1 });
recordingSchema.index({ trainerId: 1, createdAt: -1 });
recordingSchema.index({ sessionId: 1 });

module.exports = mongoose.model("Recording", recordingSchema);
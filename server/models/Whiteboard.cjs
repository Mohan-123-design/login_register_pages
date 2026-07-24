var mongoose = require("mongoose");
var whiteboardSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    drawingData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    toolType: {
      type: String,
      default: "pen",
    },
    color: {
      type: String,
      default: "#000000",
    },
    strokeWidth: {
      type: Number,
      default: 2,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Whiteboard", whiteboardSchema);

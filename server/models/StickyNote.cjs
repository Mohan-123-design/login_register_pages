var mongoose = require("mongoose");
var stickyNoteSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    noteId: {
      type: String,
      required: true,
      unique: true,
    },
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "#fff9b1",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("StickyNote", stickyNoteSchema);

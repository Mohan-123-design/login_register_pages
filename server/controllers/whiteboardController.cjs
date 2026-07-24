var Whiteboard = require("../models/Whiteboard.cjs");
var StickyNote = require("../models/StickyNote.cjs");
function saveStroke(req, res) {
  var sessionId = req.body.sessionId;
  var strokeData = req.body.strokeData;
  var userId = req.user.email;

  if (!sessionId || !strokeData) {
    return res
      .status(400)
      .json({
        success: false,
        message: "sessionId and strokeData are required.",
      });
  }

  var newDrawing = new Whiteboard({
    sessionId: sessionId,
    userId: userId,
    drawingData: strokeData,
    toolType: strokeData.tool || "Pen",
    color: strokeData.color,
    strokeWidth: strokeData.strokeWidth,
    timestamp: new Date(),
  });

  newDrawing
    .save()
    .then((saved) => res.json({ success: true, data: saved }))
    .catch((err) => {
      console.error(err);
      res.status(500).json({ success: false, message: "Error saving stroke." });
    });
}
function getWhiteboard(req, res) {
  var sessionId = req.params.sessionId;
  if (!sessionId) {
    return res
      .status(400)
      .json({ success: false, message: "sessionId is required." });
  }

  Promise.all([
    Whiteboard.find({ sessionId: sessionId }).sort({ timestamp: 1 }),
    StickyNote.find({ sessionId: sessionId }).sort({ createdAt: 1 }),
  ])
    .then(([strokes, stickies]) => {
      res.json({
        success: true,
        data: { strokes: strokes, stickies: stickies },
      });
    })
    .catch((err) => {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: "Error fetching whiteboard data." });
    });
}
function deleteWhiteboard(req, res) {
  var sessionId = req.params.sessionId;
  if (!sessionId) {
    return res
      .status(400)
      .json({ success: false, message: "sessionId is required." });
  }
  var userRole = req.user.role;
  if (userRole !== "Trainer" && userRole !== "Admin") {
    return res
      .status(403)
      .json({
        success: false,
        message: "Only trainers can clear the whiteboard.",
      });
  }

  Promise.all([
    Whiteboard.deleteMany({ sessionId: sessionId }),
    StickyNote.deleteMany({ sessionId: sessionId }),
  ])
    .then(() =>
      res.json({ success: true, message: "Whiteboard cleared successfully." }),
    )
    .catch((err) => {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: "Error clearing whiteboard." });
    });
}
function addSticky(req, res) {
  var { sessionId, noteId, x, y, text, color } = req.body;
  var userId = req.user.email;
  if (!sessionId || !noteId)
    return res.status(400).json({ success: false, message: "Missing fields" });

  var newNote = new StickyNote({
    sessionId,
    userId,
    noteId,
    x,
    y,
    text,
    color,
  });
  newNote
    .save()
    .then((saved) => res.json({ success: true, data: saved }))
    .catch((err) => {
      console.error(err);
      res.status(500).json({ success: false, message: "Error saving sticky." });
    });
}
function updateSticky(req, res) {
  var noteId = req.params.noteId;
  var { text, color, x, y } = req.body;

  StickyNote.findOneAndUpdate(
    { noteId: noteId },
    { text, color, x, y },
    { new: true },
  )
    .then((updated) => {
      if (!updated)
        return res
          .status(404)
          .json({ success: false, message: "Sticky not found" });
      res.json({ success: true, data: updated });
    })
    .catch((err) => {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: "Error updating sticky." });
    });
}
function removeSticky(req, res) {
  var noteId = req.params.noteId;
  StickyNote.findOneAndDelete({ noteId: noteId })
    .then((deleted) => {
      if (!deleted)
        return res
          .status(404)
          .json({ success: false, message: "Sticky not found" });
      res.json({ success: true });
    })
    .catch((err) => {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: "Error deleting sticky." });
    });
}

module.exports = {
  saveStroke,
  getWhiteboard,
  deleteWhiteboard,
  addSticky,
  updateSticky,
  removeSticky,
};

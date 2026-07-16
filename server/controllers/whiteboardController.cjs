var Whiteboard = require("../models/Whiteboard.cjs");
function saveWhiteboard(req, res) {
  var sessionId = req.body.sessionId;
  var drawingData = req.body.drawingData;
  var toolType = req.body.toolType;
  var color = req.body.color;
  var strokeWidth = req.body.strokeWidth;
  var userId = req.user.email;
  if (!sessionId) {
    return res
      .status(400)
      .json({ success: false, message: "sessionId is required." });
  }
  if (!drawingData) {
    return res
      .status(400)
      .json({ success: false, message: "drawingData is required." });
  }
  if (typeof drawingData !== "object") {
    return res.status(400).json({
      success: false,
      message: "drawingData must be a valid JSON object.",
    });
  }
  if (toolType) {
    if (
      toolType !== "Pen" &&
      toolType !== "Eraser" &&
      toolType !== "Shape" &&
      toolType !== "Text"
    ) {
      return res.status(400).json({
        success: false,
        message: "toolType must be Pen, Eraser, Shape, or Text.",
      });
    }
  }
  if (strokeWidth !== undefined && strokeWidth !== null) {
    if (typeof strokeWidth !== "number" || strokeWidth <= 0) {
      return res.status(400).json({
        success: false,
        message: "strokeWidth must be a positive number.",
      });
    }
  }

  var whiteboardData = {
    sessionId: sessionId,
    userId: userId,
    drawingData: drawingData,
    timestamp: new Date(),
  };
  if (toolType) {
    whiteboardData.toolType = toolType;
  }
  if (color) {
    whiteboardData.color = color;
  }
  if (strokeWidth) {
    whiteboardData.strokeWidth = strokeWidth;
  }

  var newDrawing = new Whiteboard(whiteboardData);
  newDrawing
    .save()
    .then(function (saved) {
      res.json({
        success: true,
        message: "Drawing saved successfully.",
        data: saved,
      });
    })
    .catch(function (err) {
      console.log(err);
      res
        .status(500)
        .json({ success: false, message: "Could not save drawing data." });
    });
}
function getWhiteboard(req, res) {
  var sessionId = req.params.sessionId;

  if (!sessionId) {
    return res
      .status(400)
      .json({ success: false, message: "sessionId is required." });
  }

  Whiteboard.find({ sessionId: sessionId })
    .sort({ timestamp: 1 })
    .then(function (drawings) {
      if (drawings.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No whiteboard data found for this session.",
        });
      }
      res.json({ success: true, data: drawings });
    })
    .catch(function (err) {
      console.log(err);
      res
        .status(500)
        .json({ success: false, message: "Error fetching whiteboard data." });
    });
}
function updateWhiteboard(req, res) {
  var sessionId = req.params.sessionId;
  var drawingData = req.body.drawingData;
  var toolType = req.body.toolType;
  var color = req.body.color;
  var strokeWidth = req.body.strokeWidth;

  if (!sessionId) {
    return res
      .status(400)
      .json({ success: false, message: "sessionId is required." });
  }

  if (!drawingData) {
    return res
      .status(400)
      .json({ success: false, message: "drawingData is required." });
  }

  if (typeof drawingData !== "object") {
    return res.status(400).json({
      success: false,
      message: "drawingData must be a valid JSON object.",
    });
  }
  if (toolType) {
    if (
      toolType !== "Pen" &&
      toolType !== "Eraser" &&
      toolType !== "Shape" &&
      toolType !== "Text"
    ) {
      return res.status(400).json({
        success: false,
        message: "toolType must be Pen, Eraser, Shape, or Text.",
      });
    }
  }
  var userId = req.user.email;
  Whiteboard.findOne({ sessionId: sessionId, userId: userId })
    .sort({ timestamp: -1 })
    .then(function (record) {
      if (!record) {
        return res.status(404).json({
          success: false,
          message: "No whiteboard record found for this session and user.",
        });
      }
      record.drawingData = drawingData;
      if (toolType) {
        record.toolType = toolType;
      }
      if (color) {
        record.color = color;
      }
      if (strokeWidth) {
        record.strokeWidth = strokeWidth;
      }
      record.timestamp = new Date();

      record
        .save()
        .then(function (updated) {
          res.json({
            success: true,
            message: "Whiteboard updated successfully.",
            data: updated,
          });
        })
        .catch(function (err) {
          console.log(err);
          res.status(500).json({
            success: false,
            message: "Error saving updated whiteboard.",
          });
        });
    })
    .catch(function (err) {
      console.log(err);
      res.status(500).json({
        success: false,
        message: "Error looking up whiteboard record.",
      });
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
    return res.status(403).json({
      success: false,
      message: "Only trainers can clear the whiteboard.",
    });
  }

  Whiteboard.deleteMany({ sessionId: sessionId })
    .then(function (result) {
      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "No whiteboard data found for this session.",
        });
      }
      res.json({
        success: true,
        message: "Whiteboard cleared successfully.",
        deletedCount: result.deletedCount,
      });
    })
    .catch(function (err) {
      console.log(err);
      res
        .status(500)
        .json({ success: false, message: "Error clearing whiteboard." });
    });
}

module.exports = {
  saveWhiteboard: saveWhiteboard,
  getWhiteboard: getWhiteboard,
  updateWhiteboard: updateWhiteboard,
  deleteWhiteboard: deleteWhiteboard,
};

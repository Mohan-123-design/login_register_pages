var mongoose = require("mongoose");
var Announcement = require("../models/announcement.cjs");
var Session = require("../models/Session.cjs");
var User = mongoose.model("User");
var valid_priorities = ["Low", "Medium", "High", "Emergency"];
var valid_audiences = ["All", "Batch", "Liveclassroom"];

function isBlank(str) {
  return !str || String(str).trim() === "";
}
async function createAnnouncement(req, res) {
  try {
    var title = req.body.title;
    var message = req.body.message;
    var priority = req.body.priority || "Medium";
    var targetaudience = req.body.targetAudience;
    var sessionId = req.body.sessionId || null;
    var batchId = req.body.batchId || null;
    if (isBlank(title) || isBlank(message)) {
      return res
        .status(400)
        .json({ success: false, message: "title and message are required, not be empty or whitespace-only" });
    }
    if (valid_priorities.indexOf(priority) === -1) {
      return res.status(400).json({
        success: false,
        message: "priority must be one of: " + valid_priorities.join(", "),
      });
    }
    if (!targetaudience || valid_audiences.indexOf(targetaudience) === -1) {
      return res.status(400).json({
        success: false,
        message: "targetaudience must be one of: " + valid_audiences.join(", "),
      });
    }
    if (targetaudience === "Liveclassroom") {
      if (isBlank(sessionId)) {
        return res.status(400).json({
          success: false,
          message: "sessionId is required when targetaudience is Liveclassroom",
        });
      }
      var sessionExists = await Session.findOne({ roomId: sessionId });
      if (!sessionExists) {
        return res.status(404).json({ success: false, message: "Session not found" });
      }
    }
    if (targetaudience === "Batch") {
      if (isBlank(batchId)) {
        return res.status(400).json({
          success: false,
          message: "batchId is required when targetaudience is batch",
        });
      }
      var batchExists = await User.findOne({ batch: batchId });
      if (!batchExists) {
        return res.status(404).json({ success: false, message: "Batch not found" });
      }
    }
    var announcement = new Announcement({
      sessionId: targetaudience === "Liveclassroom" ? sessionId : null,
      batchId: targetaudience === "Batch" ? batchId : null,
      senderId: req.user.email,
      senderName: req.user.firstName || "",
      senderRole: req.user.role,
      title: title,
      message: message,
      priority: priority,
      targetaudience: targetaudience,
    });
    var saved = await announcement.save();
    var io = req.app.get("io");
    if (io) {
      var classroom = io.of("/classroom");
      var payload = {
        _id: saved._id,
        sessionId: saved.sessionId,
        batchId: saved.batchId,
        senderId: saved.senderId,
        senderName: saved.senderName,
        title: saved.title,
        message: saved.message,
        priority: saved.priority,
        targetaudience: saved.targetaudience,
        createdAt: saved.createdAt,
      };
      if (targetaudience === "Liveclassroom") {
        classroom.to("session:" + sessionId).emit("New_Notification", payload);
      } else if (targetaudience === "Batch") {
        classroom.to("batch:" + batchId).emit("New_Notification", payload);
      } else {
        classroom.emit("New_Notification", payload);
      }
    }

    return res.status(201).json({ success: true, announcement: saved });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getAnnouncements(req, res) {
  try {
    var userRole = req.user.role;
    var userEmail = req.user.email;
    var query = { isDeleted: false };

    if (userRole === "Trainer" || userRole === "Admin") {
      if (req.query.sessionId) query.sessionId = req.query.sessionId;
      if (req.query.batchId) query.batchId = req.query.batchId;
      if (req.query.targetaudience) query.targetaudience = req.query.targetaudience;
    } else {
      var fullUser = await User.findOne({ email: userEmail });
      var userBatch = fullUser && fullUser.batch ? fullUser.batch : "";
      var audienceOr = [{ targetaudience: "All" }];
      if (userBatch) {
        audienceOr.push({ targetaudience: "Batch", batchId: userBatch });
      }
      if (req.query.sessionId) {
        audienceOr.push({ targetaudience: "Liveclassroom", sessionId: req.query.sessionId });
      }
      query.$or = audienceOr;
    }

    if (req.query.priority) query.priority = req.query.priority;

    if (req.query.unread === "true") {
      query.readBy = { $ne: userEmail };
    } else if (req.query.unread === "false") {
      query.readBy = userEmail;
    }

    var page = req.query.page ? parseInt(req.query.page) : 1;
    var limit = req.query.limit ? parseInt(req.query.limit) : 10;
    var skip = (page - 1) * limit;
    var [total, announcements] = await Promise.all([
      Announcement.countDocuments(query),
      Announcement.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return res.json({
      success: true,
      announcements: announcements,
      total: total,
      page: page,
      limit: limit,
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function markAsRead(req, res) {
  try {
    var id = req.params.id;
    var userEmail = req.user.email;
    var announcement = await Announcement.findById(id);
    if (!announcement || announcement.isDeleted) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    if (announcement.readBy.indexOf(userEmail) === -1) {
      announcement.readBy.push(userEmail);
    }
    announcement.isRead = true;
    await announcement.save();

    return res.json({ success: true, announcement: announcement });
  } catch (error) {
    console.error("Error marking announcement as read:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function deleteAnnouncement(req, res) {
  try {
    var id = req.params.id;
    var announcement = await Announcement.findById(id);
    if (!announcement || announcement.isDeleted) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }
    if (req.user.role !== "Admin" && announcement.senderId !== req.user.email) {
      return res
        .status(403)
        .json({ success: false, message: "You do not have permission to delete this announcement" });
    }

    announcement.isDeleted = true;
    await announcement.save();
    return res.json({ success: true, message: "Announcement deleted" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  createAnnouncement,
  getAnnouncements,
  markAsRead,
  deleteAnnouncement,
};
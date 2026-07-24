var Notification = require("../models/Notification.cjs");
var mongoose = require("mongoose");
var User = mongoose.model("User");
async function createNotification(req, res) {
  try {
    var title = req.body.title;
    var message = req.body.message;
    var recipientType = req.body.recipientType;
    var batchName = req.body.batchName;
    var recipientId = req.body.recipientId;
    var senderId = req.body.senderId;
    var senderRole = req.body.senderRole;
    var priority = req.body.priority || "Medium";
    if (!title || !message || !recipientType || !senderId || !senderRole) {
      return res
        .status(400)
        .json({
          message:
            "title, message, recipientType, senderId, and senderRole are required",
        });
    }
    if (
      recipientType !== "All" &&
      recipientType !== "Batch" &&
      recipientType !== "User"
    ) {
      return res
        .status(400)
        .json({ message: 'recipientType must be "All", "Batch", or "User"' });
    }
    if (recipientType === "Batch") {
      if (!batchName || batchName.trim() === "") {
        return res
          .status(400)
          .json({
            message:
              'batchName must not be empty when recipientType is "Batch"',
          });
      }
    }
    if (recipientType === "User") {
      if (!recipientId || recipientId.trim() === "") {
        return res
          .status(400)
          .json({
            message:
              'recipientId must not be empty when recipientType is "User"',
          });
      }
    }
    if (priority !== "Low" && priority !== "Medium" && priority !== "High") {
      return res
        .status(400)
        .json({ message: 'priority must be "Low", "Medium", or "High"' });
    }

    var newNotification = new Notification({
      title: title,
      message: message,
      recipientType: recipientType,
      batchName: batchName,
      recipientId: recipientId,
      senderId: senderId,
      senderRole: senderRole,
      priority: priority,
    });

    var savedNotification = await newNotification.save();
    return res.json({ success: true, notification: savedNotification });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getAllNotifications(req, res) {
  try {
    var query = {};
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    if (req.query.recipientType) {
      query.recipientType = req.query.recipientType;
    }
    if (req.query.status) {
      query.status = req.query.status;
    } else {
      query.status = "Active";
    }
    if (req.query.title) {
      query.title = { $regex: req.query.title, $options: "i" };
    }
    if (req.query.fromDate || req.query.toDate) {
      query.createdAt = {};
      if (req.query.fromDate && !isNaN(Date.parse(req.query.fromDate))) {
        query.createdAt.$gte = new Date(req.query.fromDate);
      }
      if (req.query.toDate && !isNaN(Date.parse(req.query.toDate))) {
        var toDate = new Date(req.query.toDate);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
      if (Object.keys(query.createdAt).length === 0) {
        delete query.createdAt;
      }
    }
    if (req.query.isRead === "false") {
      query.readBy = { $size: 0 };
    } else if (req.query.isRead === "true") {
      query["readBy.0"] = { $exists: true };
    }
    var page = 1;
    if (req.query.page) {
      page = parseInt(req.query.page);
    }
    var limit = 10;
    if (req.query.limit) {
      limit = parseInt(req.query.limit);
    }
    var skip = (page - 1) * limit;
    var highPriorityQuery = { priority: "High", status: query.status };
    var unreadQuery = { readBy: { $size: 0 }, status: query.status };
    var recentQuery = { status: query.status };
    var [
      totalCount,
      notifications,
      totalHighPriority,
      totalUnread,
      recentNotifications,
    ] = await Promise.all([
      Notification.countDocuments(query),
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(highPriorityQuery),
      Notification.countDocuments(unreadQuery),
      Notification.find(recentQuery).sort({ createdAt: -1 }).limit(5),
    ]);

    return res.json({
      success: true,
      notifications: notifications,
      total: totalCount,
      page: page,
      limit: limit,
      totalHighPriority: totalHighPriority,
      totalUnread: totalUnread,
      recentNotifications: recentNotifications,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getNotificationById(req, res) {
  try {
    var id = req.params.id;
    var notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    var userRole = req.user.role;
    var userEmail = req.user.email;
    var hasAccess = false;

    if (userRole === "Admin" || userRole === "Trainer") {
      hasAccess = true;
    } else {
      var fullUser = await User.findOne({ email: userEmail });
      var userBatch = "";
      if (fullUser && fullUser.batch) {
        userBatch = fullUser.batch;
      }

      if (notification.recipientType === "All") {
        hasAccess = true;
      } else if (
        notification.recipientType === "Batch" &&
        notification.batchName === userBatch
      ) {
        hasAccess = true;
      } else if (
        notification.recipientType === "User" &&
        notification.recipientId === userEmail
      ) {
        hasAccess = true;
      }
    }

    if (hasAccess === false) {
      return res
        .status(403)
        .json({ message: "You do not have access to this notification." });
    }

    return res.json({ success: true, notification: notification });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getMyNotifications(req, res) {
  try {
    var userEmail = req.user.email;
    var fullUser = await User.findOne({ email: userEmail });
    var userBatch = "";
    if (fullUser && fullUser.batch) {
      userBatch = fullUser.batch;
    }
    var query = {
      status: "Active",
      $or: [
        { recipientType: "All" },
        { recipientType: "Batch", batchName: userBatch },
        { recipientType: "User", recipientId: userEmail },
      ],
    };

    var notifications = await Notification.find(query).sort({ createdAt: -1 });
    return res.json({ success: true, notifications: notifications });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function markAsRead(req, res) {
  try {
    var id = req.params.id;
    var userRole = req.user.role;
    var userEmail = req.user.email;

    var notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    var hasAccess = false;
    if (userRole === "Admin" || userRole === "Trainer") {
      hasAccess = true;
    } else {
      var fullUser = await User.findOne({ email: userEmail });
      var userBatch = "";
      if (fullUser && fullUser.batch) {
        userBatch = fullUser.batch;
      }

      if (notification.recipientType === "All") {
        hasAccess = true;
      } else if (
        notification.recipientType === "Batch" &&
        notification.batchName === userBatch
      ) {
        hasAccess = true;
      } else if (
        notification.recipientType === "User" &&
        notification.recipientId === userEmail
      ) {
        hasAccess = true;
      }
    }

    if (hasAccess === false) {
      return res
        .status(403)
        .json({ message: "You do not have access to this notification." });
    }
    var alreadyRead = false;
    for (var i = 0; i < notification.readBy.length; i++) {
      if (notification.readBy[i] === userEmail) {
        alreadyRead = true;
        break;
      }
    }

    if (alreadyRead === false) {
      notification.readBy.push(userEmail);
      await notification.save();
    }

    return res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function updateNotification(req, res) {
  try {
    var id = req.params.id;

    var notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (req.body.title) {
      notification.title = req.body.title;
    }
    if (req.body.message) {
      notification.message = req.body.message;
    }
    if (req.body.priority) {
      if (
        req.body.priority === "Low" ||
        req.body.priority === "Medium" ||
        req.body.priority === "High"
      ) {
        notification.priority = req.body.priority;
      } else {
        return res
          .status(400)
          .json({ message: 'priority must be "Low", "Medium", or "High"' });
      }
    }
    notification.updatedAt = new Date();

    var updatedNotification = await notification.save();
    return res.json({ success: true, notification: updatedNotification });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function deleteNotification(req, res) {
  try {
    var id = req.params.id;

    var notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    notification.status = "Deleted";
    notification.updatedAt = new Date();
    await notification.save();

    return res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  createNotification,
  getAllNotifications,
  getNotificationById,
  getMyNotifications,
  markAsRead,
  updateNotification,
  deleteNotification,
};

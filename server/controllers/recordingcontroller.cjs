var mongoose = require("mongoose");
var jwt = require("jsonwebtoken");
var Recording = require("../models/recording.cjs");
var RecordingView = require("../models/recordingview.cjs");
var Session = require("../models/Session.cjs");
var User = mongoose.model("User"); 
var JWT_SECRET = require("../config.cjs").JWT_SECRET;
var playback_token_seconds = 600; 

var valid_statuses = [
  "Pending Upload",
  "Processing",
  "Encoding Completed",
  "Ready",
  "Failed Processing",
];
var valid_visibility = ["Public Batch", "Private Trainer"];
function isBlank(str) {
  return !str || String(str).trim() === "";
}

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}
function canManageRecording(user, recording) {
  if (user.role === "Admin") return true;
  if (user.role === "Trainer" && recording.trainerId === user.email) return true;
  return false;
}
async function canViewRecording(user, recording) {
  if (user.role === "Admin") return true;
  if (user.role === "Trainer") return recording.trainerId === user.email;
  if (recording.visibility !== "Public Batch") return false;
  var fullUser = await User.findOne({ email: user.email });
  var userBatch = fullUser && fullUser.batch ? fullUser.batch : "";
  return userBatch !== "" && userBatch === recording.batchId;
}
async function uploadRecordingMetadata(req, res) {
  try {
    var sessionId = req.body.sessionId;
    var batchId = req.body.batchId;
    var title = req.body.title;
    var description = req.body.description || "";
    var videourl = req.body.videoUrl || "";
    var thumbnailurl = req.body.thumbnailUrl || "";
    var duration = req.body.duration || "";
    var filesize = req.body.fileSize || 0;
    var starttime = req.body.startTime || null;
    var endtime = req.body.endTime || null;
    var downloadenabled =
      req.body.downloadEnabled !== undefined ? req.body.downloadEnabled : true;
    var visibility = req.body.visibility || "Public Batch";
    var trainerId =
      req.user.role === "Admin" && req.body.trainerId
        ? req.body.trainerId
        : req.user.email;

    if (isBlank(sessionId) || isBlank(batchId) || isBlank(title)) {
      return res.status(400).json({
        success: false,
        message: "sessionId, batchId and title are required",
      });
    }

    if (visibility && valid_visibility.indexOf(visibility) === -1) {
      return res.status(400).json({
        success: false,
        message: "visibility must be one of: " + valid_visibility.join(", "),
      });
    }
    var sessionExists = await Session.findOne({ roomId: sessionId });
    if (!sessionExists) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }
    var batchExists = await User.findOne({ batch: batchId });
    if (!batchExists) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }
    var trainerExists = await User.findOne({ email: trainerId, role: "Trainer" });
    if (!trainerExists) {
      return res.status(404).json({ success: false, message: "Trainer not found" });
    }
    var duplicate = await Recording.findOne({ sessionId: sessionId, isDeleted: false });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "A recording already exists for this session",
      });
    }

    var recording = new Recording({
      sessionId: sessionId,
      batchId: batchId,
      trainerId: trainerId,
      title: title,
      description: description,
      videourl: videourl,
      thumbnailurl: thumbnailurl,
      duration: duration,
      filesize: filesize,
      starttime: starttime,
      endtime: endtime,
      downloadenabled: downloadenabled,
      visibility: visibility,
      status: videourl ? "Processing" : "Pending Upload",
    });

    var saved = await recording.save();
    return res.status(201).json({ success: true, recording: saved });
  } catch (error) {
    console.error("Error uploading recording metadata:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
async function getAllRecordings(req, res) {
  try {
    var userRole = req.user.role;
    var query = { isDeleted: false };
    if (userRole === "Admin") {
      if (req.query.batchId) query.batchId = req.query.batchId;
      if (req.query.trainerId) query.trainerId = req.query.trainerId;
      if (req.query.sessionId) query.sessionId = req.query.sessionId;
    } else if (userRole === "Trainer") {
      query.trainerId = req.user.email;
      if (req.query.sessionId) query.sessionId = req.query.sessionId;
    } else {
      var fullUser = await User.findOne({ email: req.user.email });
      var userBatch = fullUser && fullUser.batch ? fullUser.batch : "";
      query.status = "Ready";
      query.visibility = "Public Batch";
      query.batchId = userBatch;
      if (req.query.sessionId) query.sessionId = req.query.sessionId;
    }

    if (req.query.search) {
      query.title = { $regex: req.query.search, $options: "i" };
    }

    var page = req.query.page ? parseInt(req.query.page) : 1;
    var limit = req.query.limit ? parseInt(req.query.limit) : 10;
    var skip = (page - 1) * limit;

    var [total, recordings] = await Promise.all([
      Recording.countDocuments(query),
      Recording.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return res.status(200).json({
      success: true,
      recordings: recordings,
      total: total,
      page: page,
      limit: limit,
    });
  } catch (error) {
    console.error("Error fetching recordings:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getRecordingDetails(req, res) {
  try {
    var id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid recording id" });
    }

    var recording = await Recording.findById(id);
    if (!recording || recording.isDeleted) {
      return res.status(404).json({ success: false, message: "Recording not found" });
    }

    var allowed = await canViewRecording(req.user, recording);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this recording",
      });
    }

    return res.status(200).json({ success: true, recording: recording });
  } catch (error) {
    console.error("Error fetching recording details:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateRecordingMetadata(req, res) {
  try {
    var id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid recording id" });
    }

    var recording = await Recording.findById(id);
    if (!recording || recording.isDeleted) {
      return res.status(404).json({ success: false, message: "Recording not found" });
    }

    if (!canManageRecording(req.user, recording)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to edit this recording",
      });
    }

    if (req.body.visibility && valid_visibility.indexOf(req.body.visibility) === -1) {
      return res.status(400).json({
        success: false,
        message: "visibility must be one of: " + valid_visibility.join(", "),
      });
    }

    if (req.body.title !== undefined) recording.title = req.body.title;
    if (req.body.description !== undefined) recording.description = req.body.description;
    if (req.body.visibility !== undefined) recording.visibility = req.body.visibility;
    if (req.body.thumbnailurl !== undefined) recording.thumbnailurl = req.body.thumbnailurl;

    var updated = await recording.save();
    return res.status(200).json({ success: true, recording: updated });
  } catch (error) {
    console.error("Error updating recording:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateRecordingStatus(req, res) {
  try {
    var id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid recording id" });
    }

    var newStatus = req.body.status;
    if (isBlank(newStatus) || valid_statuses.indexOf(newStatus) === -1) {
      return res.status(400).json({
        success: false,
        message: "status must be one of: " + valid_statuses.join(", "),
      });
    }

    var recording = await Recording.findById(id);
    if (!recording || recording.isDeleted) {
      return res.status(404).json({ success: false, message: "Recording not found" });
    }

    if (!canManageRecording(req.user, recording)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this recording",
      });
    }

    var order = ["Pending Upload", "Processing", "Encoding Completed", "Ready"];
    var currentindex = order.indexOf(recording.status);
    var newindex = order.indexOf(newStatus);
    var isforwardmove = newindex !== -1 && newindex >= currentindex;
    var isfailure = newStatus === "Failed Processing";

    if (req.user.role !== "Admin" && !isforwardmove && !isfailure) {
      return res.status(400).json({
        success: false,
        message: "Invalid status transition from " + recording.status + " to " + newStatus,
      });
    }

    recording.status = newStatus;
    var updated = await recording.save();
    return res.status(200).json({ success: true, recording: updated });
  } catch (error) {
    console.error("Error updating recording status:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
async function deleteRecording(req, res) {
  try {
    var id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid recording id" });
    }

    var recording = await Recording.findById(id);
    if (!recording || recording.isDeleted) {
      return res.status(404).json({ success: false, message: "Recording not found" });
    }

    if (!canManageRecording(req.user, recording)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this recording",
      });
    }

    var permanent = req.query.permanent === "true";
    if (permanent) {
      if (req.user.role !== "Admin") {
        return res.status(403).json({
          success: false,
          message: "Only Admin can permanently delete a recording",
        });
      }
      await Recording.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: "Recording permanently deleted" });
    }

    recording.isDeleted = true;
    recording.deletedAt = new Date();
    await recording.save();
    return res.status(200).json({ success: true, message: "Recording deleted" });
  } catch (error) {
    console.error("Error deleting recording:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getPlaybackAuthorization(req, res) {
  try {
    var id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid recording id" });
    }

    var recording = await Recording.findById(id);
    if (!recording || recording.isDeleted) {
      return res.status(404).json({ success: false, message: "Recording not found" });
    }

    var allowed = await canViewRecording(req.user, recording);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this batch or session",
      });
    }

    if (recording.status !== "Ready") {
      return res.status(409).json({
        success: false,
        message: "Recording is not ready for playback yet (status: " + recording.status + ")",
      });
    }

    var playbackToken = jwt.sign(
      { recordingId: recording._id.toString(), email: req.user.email, purpose: "playback" },
      JWT_SECRET,
      { expiresIn: playback_token_seconds }
    );

    recording.playbackCount = recording.playbackCount + 1;
    await recording.save();

    await RecordingView.create({
      recordingId: recording._id,
      viewerEmail: req.user.email,
      viewerRole: req.user.role,
      eventType: "view",
      watchDurationSeconds: 0,
    });

    return res.status(200).json({
      success: true,
      playbackUrl: recording.videoUrl,
      playbackToken: playbackToken,
      expiresIn: playback_token_seconds,
    });
  } catch (error) {
    console.error("Error authorizing playback:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function logWatchProgress(req, res) {
  try {
    var id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid recording id" });
    }
    var watchDurationSeconds = Number(req.body.watchDurationSeconds) || 0;

    await RecordingView.create({
      recordingId: id,
      viewerEmail: req.user.email,
      viewerRole: req.user.role,
      eventType: "view",
      watchDurationSeconds: watchDurationSeconds,
    });

    return res.status(200).json({ success: true, message: "Watch progress logged" });
  } catch (error) {
    console.error("Error logging watch progress:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function downloadRecording(req, res) {
  try {
    var id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid recording id" });
    }

    var recording = await Recording.findById(id);
    if (!recording || recording.isDeleted) {
      return res.status(404).json({ success: false, message: "Recording not found" });
    }

    var allowed = await canViewRecording(req.user, recording);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (recording.status !== "Ready") {
      return res.status(409).json({ success: false, message: "Recording is not ready yet" });
    }

    var isOwnerOrAdmin = req.user.role === "Admin" || req.user.email === recording.trainerId;
    if (!isOwnerOrAdmin && recording.downloadEnabled === false) {
      return res.status(403).json({
        success: false,
        message: "Downloads are disabled for this recording",
      });
    }

    recording.downloadCount = recording.downloadCount + 1;
    await recording.save();

    await RecordingView.create({
      recordingId: recording._id,
      viewerEmail: req.user.email,
      viewerRole: req.user.role,
      eventType: "download",
    });

    return res.status(200).json({ success: true, downloadUrl: recording.videoUrl });
  } catch (error) {
    console.error("Error downloading recording:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getRecordingAnalytics(req, res) {
  try {
    var id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid recording id" });
    }

    var recording = await Recording.findById(id);
    if (!recording || recording.isDeleted) {
      return res.status(404).json({ success: false, message: "Recording not found" });
    }

    if (!canManageRecording(req.user, recording)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    var viewFilter = { recordingId: recording._id, eventType: "view" };

    var [totalViews, uniqueViewerEmails, lastView, watchAgg] = await Promise.all([
      RecordingView.countDocuments(viewFilter),
      RecordingView.distinct("viewerEmail", viewFilter),
      RecordingView.findOne(viewFilter).sort({ createdAt: -1 }),
      RecordingView.aggregate([
        { $match: viewFilter },
        { $group: { _id: null, totalSeconds: { $sum: "$watchDurationSeconds" } } },
      ]),
    ]);

    var totalWatchDurationSeconds = watchAgg.length > 0 ? watchAgg[0].totalSeconds : 0;

    return res.status(200).json({
      success: true,
      analytics: {
        recordingId: recording._id,
        totalViews: totalViews,
        uniqueViewers: uniqueViewerEmails.length,
        totalWatchDurationSeconds: totalWatchDurationSeconds,
        lastViewedAt: lastView ? lastView.createdAt : null,
        downloadCount: recording.downloadCount,
        playbackCount: recording.playbackCount,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getMostViewedRecordings(req, res) {
  try {
    var query = { isDeleted: false };

    if (req.user.role === "Trainer") {
      query.trainerId = req.user.email;
    } else {
      if (req.query.batchId) query.batchId = req.query.batchId;
      if (req.query.trainerId) query.trainerId = req.query.trainerId;
    }

    var limit = req.query.limit ? parseInt(req.query.limit) : 5;

    var recordings = await Recording.find(query)
      .sort({ playbackCount: -1 })
      .limit(limit);

    return res.status(200).json({ success: true, recordings: recordings });
  } catch (error) {
    console.error("Error fetching most viewed recordings:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  uploadRecordingMetadata,
  getAllRecordings,
  getRecordingDetails,
  updateRecordingMetadata,
  updateRecordingStatus,
  deleteRecording,
  getPlaybackAuthorization,
  logWatchProgress,
  downloadRecording,
  getRecordingAnalytics,
  getMostViewedRecordings,
};
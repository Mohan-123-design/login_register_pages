var ActivityLog = require("../models/ActivityLog.cjs");
/**
 * Internal helper to create a log entry.
 *
 * @param {string} sessionId
 * @param {string} eventType
 * @param {Object} actor
 * @param {Object} [target]
 * @param {Object} [metadata]
 */
function createLog(sessionId, eventType, actor, target, metadata) {
  if (!sessionId || !eventType || !actor || !actor.id) {
    console.error("[activityLog] Missing required fields for logging:", {
      sessionId,
      eventType,
      actor,
    });
    return;
  }

  var logEntry = {
    sessionId: sessionId,
    eventType: eventType,
    actorId: actor.id,
    actorName: actor.name || actor.id,
  };

  if (target && target.id) {
    logEntry.targetId = target.id;
    logEntry.targetName = target.name || target.id;
  }

  if (metadata) {
    logEntry.metadata = metadata;
  }

  ActivityLog.create(logEntry).catch(function (err) {
    console.error("[activityLog] Error saving log to DB:", err);
  });
}

function getLogs(req, res) {
  var sessionId = req.params.sessionId;
  if (!sessionId) {
    return res
      .status(400)
      .json({ success: false, message: "sessionId is required" });
  }
  var limit = parseInt(req.query.limit, 10) || 100;
  var skip = parseInt(req.query.skip, 10) || 0;
  ActivityLog.find({ sessionId: sessionId })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .then(function (logs) {
      res.json({ success: true, data: logs });
    })
    .catch(function (err) {
      console.error("[activityLog] Error fetching logs:", err);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch activity logs" });
    });
}

module.exports = {
  createLog: createLog,
  getLogs: getLogs,
};

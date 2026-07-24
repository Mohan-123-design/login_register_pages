var Session = require("../models/Session.cjs");
var sessionController = {
  createSession: async function (req, res) {
    try {
      var {
        roomId,
        name,
        trainer,
        date,
        time,
        duration,
        description,
        status,
        isNotified,
      } = req.body;

      if (!roomId || !name || !trainer || !date || !time) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required fields" });
      }
      var existingSession = await Session.findOne({ roomId: roomId });
      if (existingSession) {
        return res
          .status(400)
          .json({
            success: false,
            message: "A session with this Room ID already exists.",
          });
      }

      var newSession = new Session({
        roomId,
        name,
        trainer,
        date,
        time,
        duration,
        description,
        status: status || "Upcoming",
        isNotified: isNotified || false,
      });

      await newSession.save();
      return res.status(201).json({ success: true, session: newSession });
    } catch (error) {
      console.error("Error creating session:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  getSessions: async function (req, res) {
    try {
      var sessions = await Session.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, sessions: sessions });
    } catch (error) {
      console.error("Error fetching sessions:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  deleteSession: async function (req, res) {
    try {
      var { roomId } = req.params;
      if (!roomId) {
        return res
          .status(400)
          .json({ success: false, message: "Missing roomId" });
      }

      var session = await Session.findOneAndDelete({ roomId: roomId });
      if (!session) {
        return res
          .status(404)
          .json({ success: false, message: "Session not found." });
      }

      return res
        .status(200)
        .json({ success: true, message: "Session deleted successfully" });
    } catch (error) {
      console.error("Error deleting session:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },
};

module.exports = sessionController;

var mongoose = require("mongoose");
var sessionSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  trainer: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  duration: { type: String, default: "" },
  description: { type: String, default: "" },
  status: { type: String, default: "Upcoming" },
  isNotified: { type: Boolean, default: false },
  locked: { type: Boolean, default: false },
  waitingRoomEnabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Session", sessionSchema);

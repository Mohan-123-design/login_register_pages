var Chat = require("../models/Chat.cjs");
function sendMessage(req, res) {
  var sessionId = req.body.sessionId;
  var message = req.body.message;
  var messageType = req.body.messageType;
  var senderId = req.user.email;
  var senderName = req.user.firstName;
  if (!sessionId) {
    return res
      .status(400)
      .json({ success: false, message: "sessionId is required." });
  }
  if (!message || message.trim() === "") {
    return res
      .status(400)
      .json({ success: false, message: "Message cannot be empty." });
  }
  if (message.length > 1000) {
    return res.status(400).json({
      success: false,
      message: "Message is too long. Max 1000 characters allowed.",
    });
  }
  if (!messageType) {
    messageType = "Text";
  }
  if (messageType !== "Text" && messageType !== "File") {
    return res.status(400).json({
      success: false,
      message: "messageType must be Text or File.",
    });
  }

  var chatData = {
    sessionId: sessionId,
    senderId: senderId,
    senderName: senderName,
    message: message.trim(),
    messageType: messageType,
    timestamp: new Date(),
  };

  var newChat = new Chat(chatData);
  newChat
    .save()
    .then(function (saved) {
      res.json({
        success: true,
        message: "Message sent successfully.",
        data: saved,
      });
    })
    .catch(function (err) {
      console.log(err);
      res
        .status(500)
        .json({ success: false, message: "Could not save message." });
    });
}

function getSessionMessages(req, res) {
  var sessionId = req.params.sessionId;
  if (!sessionId) {
    return res
      .status(400)
      .json({ success: false, message: "sessionId is required." });
  }
  Chat.find({ sessionId: sessionId })
    .sort({ timestamp: 1 })
    .then(function (messages) {
      res.json({ success: true, data: messages });
    })
    .catch(function (err) {
      console.log(err);
      res
        .status(500)
        .json({ success: false, message: "Error fetching messages." });
    });
}

function deleteMessage(req, res) {
  var messageId = req.params.messageId;
  if (!messageId) {
    return res
      .status(400)
      .json({ success: false, message: "messageId is required." });
  }
  Chat.findById(messageId)
    .then(function (chatMsg) {
      if (!chatMsg) {
        return res
          .status(404)
          .json({ success: false, message: "Message not found." });
      }
      var userRole = req.user.role;
      if (userRole !== "Trainer" && userRole !== "Admin") {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to delete messages.",
        });
      }
      Chat.findByIdAndDelete(messageId)
        .then(function () {
          res.json({
            success: true,
            message: "Message deleted successfully.",
          });
        })
        .catch(function (err) {
          console.log(err);
          res
            .status(500)
            .json({ success: false, message: "Error deleting message." });
        });
    })
    .catch(function (err) {
      console.log(err);
      if (err.name === "CastError") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid message id format." });
      }
      res
        .status(500)
        .json({ success: false, message: "Error finding message." });
    });
}

module.exports = {
  sendMessage: sendMessage,
  getSessionMessages: getSessionMessages,
  deleteMessage: deleteMessage,
};

var feedback = require("../models/feedback.cjs");
async function submitFeedback(req, res) {
  try {
    var sessionId = req.body.sessionId;
    var studentId = req.body.studentId;
    var trainerId = req.body.trainerId;
    var rating = req.body.rating;
    var review = req.body.review || "";
    var tags = req.body.tags;
    if (!sessionId || !studentId || !trainerId || !rating) {
      return res.status(400).json({
        success: false,
        message: "sessionId, studentId, trainerId and rating are required",
      });
    }
    var ratingnumber = Number(rating);
    if (isNaN(ratingnumber) || ratingnumber < 1 || ratingnumber > 5) {
      return res
        .status(400)
        .json({ success: false, message: "rating must be a number between 1 and 5" });
    }
    var allowedtags = ["Excellent", "Good", "Average", "Poor"];
    if (tags && allowedtags.indexOf(tags) === -1) {
      return res
        .status(400)
        .json({ success: false, message: "tags must be Excellent, Good, Average or Poor" });
    }
    var existingfeedback = await feedback.findOne({ sessionId: sessionId, studentId: studentId });
    if (existingfeedback) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted feedback for this session",
      });
    }
    var newfeedback = new feedback({
      sessionId: sessionId,
      studentId: studentId,
      trainerId: trainerId,
      rating: ratingnumber,
      review: review,
      tags: tags || "Good",
    });
    await newfeedback.save();
    return res.status(201).json({ success: true, feedback: newfeedback });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted feedback for this session",
      });
    }
    console.error("Error submitting feedback:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
async function buildAnalytics(matchQuery) {
  var averageresult = await feedback.aggregate([
    { $match: matchQuery },
    { $group: { _id: null, averagerating: { $avg: "$rating" }, totalfeedback: { $sum: 1 } } },
  ]);
  var distributionresult = await feedback.aggregate([
    { $match: matchQuery },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);

  var ratingdistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (var i = 0; i < distributionresult.length; i++) {
    ratingdistribution[distributionresult[i]._id] = distributionresult[i].count;
  }

  var averagerating = 0;
  var totalfeedback = 0;
  if (averageresult.length > 0) {
    averagerating = Math.round(averageresult[0].averagerating * 10) / 10;
    totalfeedback = averageresult[0].totalfeedback;
  }
  return { averagerating: averagerating, totalFeedback: totalfeedback, ratingDistribution: ratingdistribution };
}

async function getFeedbackBySession(req, res) {
  try {
    var sessionid = req.params.sessionId;
    var query = { sessionid: sessionid };

    if (req.query.search) {
      query.review = { $regex: req.query.search, $options: "i" };
    }
    if (req.query.tags) {
      query.tags = req.query.tags;
    }

    var page = req.query.page ? parseInt(req.query.page) : 1;
    var limit = req.query.limit ? parseInt(req.query.limit) : 10;
    var skip = (page - 1) * limit;
    var [totalcount, feedbacklist, analytics] = await Promise.all([
      feedback.countDocuments(query),
      feedback.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      buildAnalytics({ sessionid: sessionid }), 
    ]);

    return res.json({
      success: true,
      feedback: feedbacklist,
      total: totalcount,
      page: page,
      limit: limit,
      averagerating: analytics.averagerating,
      totalfeedback: analytics.totalFeedback,
      ratingdistribution: analytics.ratingdistribution,
    });
  } catch (error) {
    console.error("Error fetching session feedback:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getTrainerFeedback(req, res) {
  try {
    var trainerid = req.params.trainerId;
    var query = { trainerId: trainerid };

    if (req.query.search) {
      query.review = { $regex: req.query.search, $options: "i" };
    }
    if (req.query.tags) {
      query.tags = req.query.tags;
    }
    if (req.query.sessionid) {
      query.sessionid = req.query.sessionid;
    }

    var page = req.query.page ? parseInt(req.query.page) : 1;
    var limit = req.query.limit ? parseInt(req.query.limit) : 10;
    var skip = (page - 1) * limit;

    var [totalcount, feedbacklist, analytics] = await Promise.all([
      feedback.countDocuments(query),
      feedback.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      buildAnalytics({ trainerId: trainerid }),
    ]);

    return res.json({
      success: true,
      feedback: feedbacklist,
      total: totalcount,
      page: page,
      limit: limit,
      averageRating: analytics.averagerating,
      totalFeedback: analytics.totalfeedback,
      ratingDistribution: analytics.ratingdistribution,
    });
  } catch (error) {
    console.error("Error fetching trainer feedback:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  submitFeedback,
  getFeedbackBySession,
  getTrainerFeedback,
};
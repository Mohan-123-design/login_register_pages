var User = require("../models/user.cjs") 
var Session = require("../models/Session.cjs");
var ActivityLog = require("../models/ActivityLog.cjs");
var Course = require("../models/course.cjs");
var Exam = require("../models/exam.cjs");
var Certificate = require("../models/certificate.cjs");
var Assignment = require("../models/assignment.cjs");

var dashboardController = {
  getDashboard: async function (req, res) {
    try {
      var userAggregation = await User.aggregate([
        {
          $facet: {
            roleCounts: [
              { $group: { _id: "$role", count: { $sum: 1 } } },
            ],
            batchCounts: [
              { $match: { batch: { $ne: "" } } },
              { $group: { _id: "$batch" } },
              { $count: "totalBatches" },
            ],
            recentRegistrations: [
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              {
                $project: {
                  _id: 0,
                  firstName: 1,
                  lastName: 1,
                  email: 1,
                  role: 1,
                  createdAt: 1,
                },
              },
            ],
          },
        },
      ]);

      var facetResult = userAggregation[0];
      var totalStudents = 0;
      var totalTrainers = 0;
      for (var i = 0; i < facetResult.roleCounts.length; i++) {
        var group = facetResult.roleCounts[i];
        if (group._id === "Student" || group._id === "Employee") {
          totalStudents += group.count;
        } else if (group._id === "Trainer") {
          totalTrainers += group.count;
        }
      }
      var totalBatches =
        facetResult.batchCounts.length > 0
          ? facetResult.batchCounts[0].totalBatches
          : 0;

      var sessionAggregation = await Session.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
      var activeLiveSessions = 0;
      var completedSessions = 0;
      for (var j = 0; j < sessionAggregation.length; j++) {
        var sGroup = sessionAggregation[j];
        if (sGroup._id === "Live" || sGroup._id === "Ongoing") {
          activeLiveSessions += sGroup.count;
        } else if (sGroup._id === "Completed") {
          completedSessions += sGroup.count;
        }
      }

      var totalCourses = await Course.countDocuments({});
      var totalExams = await Exam.countDocuments({});
      var totalCertificates = await Certificate.countDocuments({});
      var pendingAssignments = await Assignment.countDocuments({
        status: "Pending",
      });

      var recentActivity = await ActivityLog.find({
        eventType: {
          $in: ["user:login", "session:started", "session:ended", "notification:sent"],
        },
      })
        .sort({ timestamp: -1 })
        .limit(10);

      return res.status(200).json({
        success: true,
        stats: {
          totalStudents: totalStudents,
          totalTrainers: totalTrainers,
          totalCourses: totalCourses,
          totalBatches: totalBatches,
          activeLiveSessions: activeLiveSessions,
          completedSessions: completedSessions,
          totalExams: totalExams,
          totalCertificates: totalCertificates,
          pendingAssignments: pendingAssignments,
        },
        recentRegistrations: facetResult.recentRegistrations,
        recentActivity: recentActivity,
      });
    } catch (error) {
      console.error("Error building admin dashboard:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },
};

module.exports = dashboardController;
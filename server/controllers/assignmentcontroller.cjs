var Assignment = require("../models/assignment.cjs");
var AssignmentSubmission = require("../models/assignmentsubmission.cjs");
var Course = require("../models/course.cjs");
var Batch = require("../models/batch.cjs");
var Notification = require("../models/Notification.cjs");

function computeGrade(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

function isStudentInBatch(batch, email) {
  if (!batch || !batch.students) return false;
  return batch.students.some(function (s) {
    return s.studentEmail === email;
  });
}

function toAssignmentSummary(assignmentDoc) {
  var obj = assignmentDoc.toObject ? assignmentDoc.toObject() : assignmentDoc;
  obj.attachmentCount = obj.attachments ? obj.attachments.length : 0;
  obj.isOverdue = obj.dueDate ? new Date() > new Date(obj.dueDate) : false;
  return obj;
}

var assignmentController = {
  uploadFile: async function (req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file was uploaded." });
      }
      return res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        fileName: req.file.originalname,
        fileUrl: "/api/uploads/assignments/" + req.file.filename,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  getAllAssignments: async function (req, res) {    try {
      var search = req.query.search || "";
      var statusFilter = req.query.status || "";
      var courseId = req.query.courseId || "";
      var batchId = req.query.batchId || "";
      var page = parseInt(req.query.page, 10) || 1;
      var limit = parseInt(req.query.limit, 10) || 10;

      var query = {};
      if (search.trim() !== "") {
        var regex = new RegExp(search.trim(), "i");
        query.$or = [{ title: regex }, { courseName: regex }, { batchName: regex }];
      }
      if (courseId !== "") query.courseId = courseId;
      if (batchId !== "") query.batchId = batchId;
      if (statusFilter !== "") query.status = statusFilter;

      var role = req.user.role;
      if (role === "Student" || role === "Employee") {
        if (statusFilter === "Draft") {
          query.status = "__none__"; 
        } else if (statusFilter === "") {
          query.status = { $ne: "Draft" };
        }
      }
      var totalAssignments = await Assignment.countDocuments(query);
      var assignments = await Assignment.find(query)
        .sort({ dueDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      var summarized = assignments.map(toAssignmentSummary);
      if (role === "Student" || role === "Employee") {
        var batchIds = summarized.map(function (a) { return a.batchId; }).filter(Boolean);
        var batches = await Batch.find({ _id: { $in: batchIds } }).select("students");
        var batchMap = {};
        batches.forEach(function (b) {
          batchMap[b._id.toString()] = b;
        });
        summarized = summarized.filter(function (a) {
          if (!a.batchId) return true;
          return isStudentInBatch(batchMap[a.batchId.toString()], req.user.email);
        });
      }

      var assignmentIds = summarized.map(function (a) { return a._id; });
      var submissionCounts = await AssignmentSubmission.aggregate([
        { $match: { assignmentId: { $in: assignmentIds }, submissionStatus: { $ne: "Not Submitted" } } },
        { $group: { _id: "$assignmentId", count: { $sum: 1 } } },
      ]);
      var submissionMap = {};
      submissionCounts.forEach(function (row) {
        submissionMap[row._id.toString()] = row.count;
      });
      var batchIdsForSize = summarized.map(function (a) { return a.batchId; }).filter(Boolean);
      var batchesForSize = await Batch.find({ _id: { $in: batchIdsForSize } }).select("students");
      var batchSizeMap = {};
      batchesForSize.forEach(function (b) {
        batchSizeMap[b._id.toString()] = b.students ? b.students.length : 0;
      });
      summarized = summarized.map(function (a) {
        a.submissionCount = submissionMap[a._id.toString()] || 0;
        a.totalStudents = a.batchId ? batchSizeMap[a.batchId.toString()] || 0 : 0;
        return a;
      });

      if (role === "Student" || role === "Employee") {
        var myRecords = await AssignmentSubmission.find({
          assignmentId: { $in: assignmentIds },
          studentEmail: req.user.email,
        });
        var myMap = {};
        myRecords.forEach(function (r) {
          myMap[r.assignmentId.toString()] = r;
        });
        summarized = summarized.map(function (a) {
          var mine = myMap[a._id.toString()];
          a.mySubmissionStatus = mine ? mine.submissionStatus : "Not Submitted";
          a.myEvaluationStatus = mine ? mine.evaluationStatus : null;
          a.myObtainedMarks = mine && mine.evaluationStatus === "Graded" ? mine.obtainedMarks : null;
          return a;
        });
      }

      return res.status(200).json({
        success: true,
        assignments: summarized,
        total: totalAssignments,
        page: page,
        totalPages: Math.ceil(totalAssignments / limit) || 1,
      });
    } catch (error) {
      console.error("Error fetching assignments:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  getAssignmentById: async function (req, res) {
    try {
      var assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ success: false, message: "Assignment not found" });
      }
      var summary = toAssignmentSummary(assignment);
      var role = req.user.role;

      if (role === "Student" || role === "Employee") {
        if (summary.status === "Draft") {
          return res.status(403).json({ success: false, message: "This assignment is not available." });
        }
        if (assignment.batchId) {
          var batchCheck = await Batch.findById(assignment.batchId).select("students");
          if (!isStudentInBatch(batchCheck, req.user.email)) {
            return res
              .status(403)
              .json({ success: false, message: "You are not enrolled in the batch for this assignment." });
          }
        }
        var mySubmission = await AssignmentSubmission.findOne({
          assignmentId: assignment._id,
          studentEmail: req.user.email,
        });
        summary.mySubmissionStatus = mySubmission ? mySubmission.submissionStatus : "Not Submitted";
        summary.myEvaluationStatus = mySubmission ? mySubmission.evaluationStatus : null;
      }

      return res.status(200).json({ success: true, assignment: summary });
    } catch (error) {
      console.error("Error fetching assignment:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  createAssignment: async function (req, res) {
    try {
      var title = req.body.title;
      if (!title || title.trim() === "") {
        return res.status(400).json({ success: false, message: "Assignment title is required" });
      }
      var dueDate = req.body.dueDate;
      if (!dueDate) {
        return res.status(400).json({ success: false, message: "Due date is required" });
      }
      var totalMarks = parseInt(req.body.totalMarks, 10);
      if (!totalMarks || totalMarks <= 0) {
        return res.status(400).json({ success: false, message: "Total marks must be a positive number" });
      }
      var latePenaltyPercent = parseInt(req.body.latePenaltyPercent, 10);
      if (isNaN(latePenaltyPercent) || latePenaltyPercent < 0 || latePenaltyPercent > 100) {
        latePenaltyPercent = 0;
      }
      var courseId = req.body.courseId || null;
      var courseName = "";
      if (courseId) {
        var course = await Course.findById(courseId);
        if (!course) {
          return res.status(400).json({ success: false, message: "Selected course was not found" });
        }
        courseName = course.title;
      }
      var batchId = req.body.batchId || null;
      var batchName = "";
      if (batchId) {
        var batch = await Batch.findById(batchId);
        if (!batch) {
          return res.status(400).json({ success: false, message: "Selected batch was not found" });
        }
        batchName = batch.name;
      }

var attachments = Array.isArray(req.body.attachments) ? req.body.attachments : [];
      var referenceLinks = Array.isArray(req.body.referenceLinks)
        ? req.body.referenceLinks.filter(function (l) { return l && l.trim() !== ""; }).map(function (l) { return l.trim(); })
        : [];
      var topics = Array.isArray(req.body.topics)
        ? req.body.topics
            .filter(function (t) { return t && t.topicText && t.topicText.trim() !== ""; })
            .map(function (t) {
              return { topicText: t.topicText.trim(), description: t.description ? t.description.trim() : "" };
            })
        : [];      var newAssignment = new Assignment({
        title: title.trim(),
        courseId: courseId,
        courseName: courseName,
        batchId: batchId,
        batchName: batchName,
        description: req.body.description || "",
        instructions: req.body.instructions || "",
        totalMarks: totalMarks,
        dueDate: dueDate,
attachments: attachments,
        referenceLinks: referenceLinks,
        topics: topics,
                latePenaltyPercent: latePenaltyPercent,
        status: "Draft",
        createdByEmail: req.user.email,
        createdByName: req.user.firstName || "",
      });
      await newAssignment.save();
      return res.status(201).json({
        success: true,
        message: "Assignment created successfully",
        assignment: toAssignmentSummary(newAssignment),
      });
    } catch (error) {
      console.error("Error creating assignment:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  updateAssignment: async function (req, res) {
    try {
      var assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ success: false, message: "Assignment not found" });
      }

      if (req.body.title !== undefined) {
        if (req.body.title.trim() === "") {
          return res.status(400).json({ success: false, message: "Assignment title is required" });
        }
        assignment.title = req.body.title.trim();
      }
      if (req.body.dueDate !== undefined) assignment.dueDate = req.body.dueDate;
      if (req.body.totalMarks !== undefined) {
        var totalMarks = parseInt(req.body.totalMarks, 10);
        if (!totalMarks || totalMarks <= 0) {
          return res.status(400).json({ success: false, message: "Total marks must be a positive number" });
        }
        assignment.totalMarks = totalMarks;
      }
      if (req.body.description !== undefined) assignment.description = req.body.description;
      if (req.body.instructions !== undefined) assignment.instructions = req.body.instructions;
if (req.body.attachments !== undefined) {
        assignment.attachments = Array.isArray(req.body.attachments) ? req.body.attachments : [];
      }
      if (req.body.referenceLinks !== undefined) {
        assignment.referenceLinks = Array.isArray(req.body.referenceLinks)
          ? req.body.referenceLinks.filter(function (l) { return l && l.trim() !== ""; }).map(function (l) { return l.trim(); })
          : [];
      }
      if (req.body.topics !== undefined) {
        assignment.topics = Array.isArray(req.body.topics)
          ? req.body.topics
              .filter(function (t) { return t && t.topicText && t.topicText.trim() !== ""; })
              .map(function (t) {
                return { topicText: t.topicText.trim(), description: t.description ? t.description.trim() : "" };
              })
          : [];
      }      if (req.body.latePenaltyPercent !== undefined) {
        var lp = parseInt(req.body.latePenaltyPercent, 10);
        assignment.latePenaltyPercent = isNaN(lp) || lp < 0 || lp > 100 ? 0 : lp;
      }

      if (req.body.courseId !== undefined) {
        if (req.body.courseId) {
          var course = await Course.findById(req.body.courseId);
          if (!course) {
            return res.status(400).json({ success: false, message: "Selected course was not found" });
          }
          assignment.courseId = course._id;
          assignment.courseName = course.title;
        } else {
          assignment.courseId = null;
          assignment.courseName = "";
        }
      }
      if (req.body.batchId !== undefined) {
        if (req.body.batchId) {
          var batch = await Batch.findById(req.body.batchId);
          if (!batch) {
            return res.status(400).json({ success: false, message: "Selected batch was not found" });
          }
          assignment.batchId = batch._id;
          assignment.batchName = batch.name;
        } else {
          assignment.batchId = null;
          assignment.batchName = "";
        }
      }

      await assignment.save();
      return res
        .status(200)
        .json({ success: true, message: "Assignment updated successfully", assignment: toAssignmentSummary(assignment) });
    } catch (error) {
      console.error("Error updating assignment:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  deleteAssignment: async function (req, res) {
    try {
      var assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ success: false, message: "Assignment not found" });
      }
      await AssignmentSubmission.deleteMany({ assignmentId: assignment._id });
      await Assignment.findByIdAndDelete(req.params.id);
      return res.status(200).json({ success: true, message: "Assignment deleted successfully" });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  publishAssignment: async function (req, res) {
    try {
      var assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ success: false, message: "Assignment not found" });
      }
      if (assignment.status !== "Draft") {
        return res.status(400).json({ success: false, message: "Only draft assignments can be published" });
      }
assignment.status = "Published";
      await assignment.save();

      try {
        var notificationPayload = {
          title: "New Assignment: " + assignment.title,
          message:
            'A new assignment "' + assignment.title + '" has been posted. Due on ' +
            new Date(assignment.dueDate).toLocaleString() + " (" + assignment.totalMarks + " marks).",
          senderId: req.user.email,
          senderRole: req.user.role,
          priority: "High",
        };
        if (assignment.batchName) {
          notificationPayload.recipientType = "Batch";
          notificationPayload.batchName = assignment.batchName;
        } else {
          // No batch was selected for this assignment - fall back to notifying
          // everyone instead of silently sending nothing.
          notificationPayload.recipientType = "All";
        }
        await Notification.create(notificationPayload);
      } catch (notifyError) {
        console.error("Error creating assignment publish notification:", notifyError);
      }
      return res
        .status(200)
        .json({ success: true, message: "Assignment published successfully", assignment: toAssignmentSummary(assignment) });
    } catch (error) {
      console.error("Error publishing assignment:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  unpublishAssignment: async function (req, res) {
    try {
      var assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ success: false, message: "Assignment not found" });
      }
      if (assignment.status !== "Published") {
        return res.status(400).json({ success: false, message: "Only published assignments can be unpublished" });
      }
      assignment.status = "Draft";
      await assignment.save();
      return res
        .status(200)
        .json({ success: true, message: "Assignment moved back to draft", assignment: toAssignmentSummary(assignment) });
    } catch (error) {
      console.error("Error unpublishing assignment:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  openAssignment: async function (req, res) {
    try {
      var assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ success: false, message: "Assignment not found" });
      }
      if (assignment.status !== "Published" && assignment.status !== "Closed") {
        return res
          .status(400)
          .json({ success: false, message: "Only published or closed assignments can be opened for submission" });
      }
      assignment.status = "Open";
      await assignment.save();
      return res
        .status(200)
        .json({ success: true, message: "Assignment is now open for submissions", assignment: toAssignmentSummary(assignment) });
    } catch (error) {
      console.error("Error opening assignment:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  closeAssignment: async function (req, res) {
    try {
      var assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ success: false, message: "Assignment not found" });
      }
      if (assignment.status !== "Open") {
        return res.status(400).json({ success: false, message: "Only open assignments can be closed" });
      }
      assignment.status = "Closed";
      await assignment.save();
      return res
        .status(200)
        .json({ success: true, message: "Assignment closed. Students can no longer submit.", assignment: toAssignmentSummary(assignment) });
    } catch (error) {
      console.error("Error closing assignment:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  completeAssignment: async function (req, res) {
    try {
      var assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ success: false, message: "Assignment not found" });
      }
      if (assignment.status !== "Closed") {
        return res.status(400).json({ success: false, message: "Only closed assignments can be marked completed" });
      }
      assignment.status = "Completed";
      await assignment.save();
      return res
        .status(200)
        .json({ success: true, message: "Assignment marked as completed", assignment: toAssignmentSummary(assignment) });
    } catch (error) {
      console.error("Error completing assignment:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  submitAssignment: async function (req, res) {
    try {
      var assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ success: false, message: "Assignment not found" });
      }
if (assignment.status !== "Open" && assignment.status !== "Published") {
        return res.status(400).json({
          success: false,
          message:
            assignment.status === "Draft"
              ? "This assignment is not available yet."
              : "This assignment is closed and no longer accepts submissions.",
        });
      }      if (assignment.batchId) {
        var batch = await Batch.findById(assignment.batchId).select("students");
        if (!isStudentInBatch(batch, req.user.email)) {
          return res
            .status(403)
            .json({ success: false, message: "You are not enrolled in the batch for this assignment." });
        }
      }

      var answerText = req.body.answerText || "";
      var submittedFiles = Array.isArray(req.body.submittedFiles) ? req.body.submittedFiles : [];
      var referredLinks = Array.isArray(req.body.referredLinks)
        ? req.body.referredLinks.filter(function (l) { return l && l.trim() !== ""; }).map(function (l) { return l.trim(); })
        : [];
      if (answerText.trim() === "" && submittedFiles.length === 0 && referredLinks.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Please provide an answer, upload a document, or add a referred link before submitting." });
      }

      var existing = await AssignmentSubmission.findOne({ assignmentId: assignment._id, studentEmail: req.user.email });
      if (existing && existing.evaluationStatus === "Graded") {
        return res
          .status(400)
          .json({ success: false, message: "This submission has already been graded and can no longer be changed." });
      }

      var now = new Date();
      var isLate = now > new Date(assignment.dueDate);
      var studentName = (req.user.firstName || "") + (req.user.lastName ? " " + req.user.lastName : "");

      var update = {
        studentName: studentName.trim(),
        answerText: answerText,
        submittedFiles: submittedFiles,
        referredLinks: referredLinks,
        submittedAt: now,
        isLate: isLate,
        submissionStatus: isLate ? "Late" : "Submitted",
        evaluationStatus: "Pending Evaluation",
        totalMarks: assignment.totalMarks,
        latePenaltyApplied: isLate ? assignment.latePenaltyPercent : 0,
      };

      var submission = await AssignmentSubmission.findOneAndUpdate(
        { assignmentId: assignment._id, studentEmail: req.user.email },
        { $set: update, $setOnInsert: { assignmentId: assignment._id, studentEmail: req.user.email } },
        { new: true, upsert: true },
      );

      return res.status(200).json({
        success: true,
        message: isLate
          ? "Assignment submitted. Note: this was submitted after the due date and is marked as Late."
          : "Assignment submitted successfully",
        submission: submission,
      });
    } catch (error) {
      console.error("Error submitting assignment:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  getMySubmission: async function (req, res) {
    try {
      var submission = await AssignmentSubmission.findOne({
        assignmentId: req.params.id,
        studentEmail: req.user.email,
      });
      if (!submission) {
        return res.status(200).json({
          success: true,
          submission: {
            submissionStatus: "Not Submitted",
            evaluationStatus: null,
            obtainedMarks: 0,
            percentage: 0,
            grade: "-",
            feedback: "",
            submittedFiles: [],
            referredLinks: [],
          },
        });
      }
      return res.status(200).json({ success: true, submission: submission });
    } catch (error) {
      console.error("Error fetching my submission:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  getSubmissions: async function (req, res) {
    try {
      var assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ success: false, message: "Assignment not found" });
      }
      var statusFilter = req.query.status || ""; 
      var submissions = await AssignmentSubmission.find({ assignmentId: assignment._id }).sort({ submittedAt: -1 });

      var roster = [];
      if (assignment.batchId) {
        var batch = await Batch.findById(assignment.batchId);
        if (batch) roster = batch.students || [];
      }
      var submissionMap = {};
      submissions.forEach(function (s) {
        submissionMap[s.studentEmail] = s;
      });

      var rows = roster.map(function (student) {
        var s = submissionMap[student.studentEmail];
        if (s) {
          return formatSubmissionRow(s, assignment);
        }
        return {
          studentEmail: student.studentEmail,
          studentName: student.studentName,
          submissionStatus: "Not Submitted",
          evaluationStatus: null,
          displayStatus: "Not Submitted",
          isLate: false,
          submittedAt: null,
          totalMarks: assignment.totalMarks,
          obtainedMarks: null,
          percentage: null,
          grade: "-",
          feedback: "",
        };
      });
      submissions.forEach(function (s) {
        var alreadyListed = rows.some(function (r) {
          return r.studentEmail === s.studentEmail;
        });
        if (!alreadyListed) rows.push(formatSubmissionRow(s, assignment));
      });

      if (statusFilter !== "") {
        rows = rows.filter(function (r) {
          return r.displayStatus === statusFilter || r.submissionStatus === statusFilter || r.evaluationStatus === statusFilter;
        });
      }

      return res.status(200).json({ success: true, assignment: toAssignmentSummary(assignment), submissions: rows });
    } catch (error) {
      console.error("Error fetching submissions:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  gradeSubmission: async function (req, res) {
    try {
      var assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ success: false, message: "Assignment not found" });
      }
      var studentEmail = req.body.studentEmail;
      if (!studentEmail) {
        return res.status(400).json({ success: false, message: "studentEmail is required" });
      }
      var submission = await AssignmentSubmission.findOne({ assignmentId: assignment._id, studentEmail: studentEmail });
      if (!submission || submission.submissionStatus === "Not Submitted") {
        return res
          .status(400)
          .json({ success: false, message: "This student has not submitted the assignment yet, so it cannot be graded." });
      }

      var obtainedMarksRaw = parseFloat(req.body.obtainedMarks);
      if (isNaN(obtainedMarksRaw) || obtainedMarksRaw < 0) {
        return res.status(400).json({ success: false, message: "obtainedMarks must be a non-negative number" });
      }
      if (obtainedMarksRaw > assignment.totalMarks) {
        return res
          .status(400)
          .json({ success: false, message: "obtainedMarks cannot exceed the assignment's total marks" });
      }

      var waivePenalty = req.body.waivePenalty === true;
      var finalMarks = obtainedMarksRaw;
      if (submission.isLate && assignment.latePenaltyPercent > 0 && !waivePenalty) {
        finalMarks = obtainedMarksRaw - (obtainedMarksRaw * assignment.latePenaltyPercent) / 100;
        finalMarks = Math.round(finalMarks * 100) / 100;
      }

      var percentage = assignment.totalMarks > 0 ? Math.round((finalMarks / assignment.totalMarks) * 1000) / 10 : 0;
      var grade = computeGrade(percentage);

      submission.obtainedMarks = finalMarks;
      submission.percentage = percentage;
      submission.grade = grade;
      submission.feedback = req.body.feedback !== undefined ? req.body.feedback : submission.feedback;
      submission.evaluationStatus = "Graded";
      submission.penaltyWaived = waivePenalty;
      submission.gradedBy = req.user.email;
      submission.gradedAt = new Date();
      await submission.save();

      return res.status(200).json({ success: true, message: "Submission graded successfully", submission: submission });
    } catch (error) {
      console.error("Error grading submission:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  getOverview: async function (req, res) {
    try {
      var assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ success: false, message: "Assignment not found" });
      }
      var totalStudents = 0;
      if (assignment.batchId) {
        var batch = await Batch.findById(assignment.batchId);
        totalStudents = batch && batch.students ? batch.students.length : 0;
      }
      var submissions = await AssignmentSubmission.find({ assignmentId: assignment._id });
      var submitted = submissions.filter(function (s) {
        return s.submissionStatus !== "Not Submitted";
      });
      var graded = submitted.filter(function (s) {
        return s.evaluationStatus === "Graded";
      });
      var pending = submitted.filter(function (s) {
        return s.evaluationStatus === "Pending Evaluation";
      });
      var late = submitted.filter(function (s) {
        return s.isLate === true;
      });

      var totalScore = graded.reduce(function (sum, s) {
        return sum + (s.obtainedMarks || 0);
      }, 0);
      var averageMarks = graded.length > 0 ? Math.round((totalScore / graded.length) * 10) / 10 : 0;
      var submissionPercentage =
        totalStudents > 0 ? Math.round((submitted.length / totalStudents) * 1000) / 10 : 0;

      return res.status(200).json({
        success: true,
        assignment: toAssignmentSummary(assignment),
        overview: {
          totalStudents: totalStudents,
          totalSubmissions: submitted.length,
          pendingSubmissions: pending.length,
          completedSubmissions: graded.length,
          lateSubmissions: late.length,
          notSubmittedCount: Math.max(totalStudents - submitted.length, 0),
          averageMarks: averageMarks,
          submissionPercentage: submissionPercentage,
        },
      });
    } catch (error) {
      console.error("Error building assignment overview:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
};

function formatSubmissionRow(s, assignment) {
  var displayStatus = s.evaluationStatus === "Graded" ? "Graded" : s.submissionStatus;
  return {
    studentEmail: s.studentEmail,
    studentName: s.studentName,
    submissionStatus: s.submissionStatus,
    evaluationStatus: s.evaluationStatus,
    displayStatus: displayStatus,
    isLate: s.isLate,
    submittedAt: s.submittedAt,
    dueDate: assignment.dueDate,
    totalMarks: assignment.totalMarks,
    obtainedMarks: s.evaluationStatus === "Graded" ? s.obtainedMarks : null,
    percentage: s.evaluationStatus === "Graded" ? s.percentage : null,
    grade: s.evaluationStatus === "Graded" ? s.grade : "-",
    feedback: s.feedback,
    answerText: s.answerText,
    submittedFiles: s.submittedFiles,
    referredLinks: s.referredLinks,
    latePenaltyApplied: s.latePenaltyApplied,
    penaltyWaived: s.penaltyWaived,
  };
}

module.exports = assignmentController;
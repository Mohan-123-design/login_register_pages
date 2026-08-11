var Exam = require("../models/exam.cjs");
var ExamResult = require("../models/examresult.cjs");
var Course = require("../models/course.cjs");
var Batch = require("../models/batch.cjs");
var Notification = require("../models/Notification.cjs");
function getEffectiveStatus(exam) {
  if (exam.status === "Draft") return "Draft";
  if (exam.status === "Unpublished") return "Unpublished";
  var now = new Date();
  var start = new Date(exam.examDate);
  var end = new Date(start.getTime() + (exam.duration || 0) * 60000);

  if (now < start) return "Published";
  if (now >= start && now <= end) return "Ongoing";
  return "Completed";
}

function toExamSummary(examDoc) {
  var obj = examDoc.toObject ? examDoc.toObject() : examDoc;
  obj.effectiveStatus = getEffectiveStatus(obj);
  obj.questionCount = obj.questions ? obj.questions.length : 0;
  return obj;
}

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
var examController = {
  getAllExams: async function (req, res) {
    try {
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

      var role = req.user.role;
      if (role === "Student" || role === "Employee") {
        query.status = "Published";
      }
      var totalExams = await Exam.countDocuments(query);
      var exams = await Exam.find(query)
        .sort({ examDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      var summarized = exams.map(toExamSummary);
      if (statusFilter !== "") {
        summarized = summarized.filter(function (e) {
          return e.effectiveStatus === statusFilter;
        });
      }
      if (role === "Student" || role === "Employee") {
        summarized = summarized.filter(function (e) {
          return e.effectiveStatus !== "Draft" && e.effectiveStatus !== "Unpublished";
        });
      }
      var examIds = summarized.map(function (e) {
        return e._id;
      });
      var attemptCounts = await ExamResult.aggregate([
        { $match: { examId: { $in: examIds }, completionStatus: { $ne: "Not Attempted" } } },
        { $group: { _id: "$examId", count: { $sum: 1 } } },
      ]);
      var attemptMap = {};
      attemptCounts.forEach(function (row) {
        attemptMap[row._id.toString()] = row.count;
      });
      var batchIds = summarized
        .map(function (e) {
          return e.batchId;
        })
        .filter(Boolean);
      var batches = await Batch.find({ _id: { $in: batchIds } }).select("students");
      var batchSizeMap = {};
      var batchMap = {};
      batches.forEach(function (b) {
        batchSizeMap[b._id.toString()] = b.students ? b.students.length : 0;
        batchMap[b._id.toString()] = b;
      });

      summarized = summarized.map(function (e) {
        e.attemptedCount = attemptMap[e._id.toString()] || 0;
        e.totalStudents = e.batchId ? batchSizeMap[e.batchId.toString()] || 0 : 0;
        return e;
      });
      if (role === "Student" || role === "Employee") {
        summarized = summarized.filter(function (e) {
          if (!e.batchId) return true;
          return isStudentInBatch(batchMap[e.batchId.toString()], req.user.email);
        });
      }

      if (role === "Student" || role === "Employee") {
        var myResults = await ExamResult.find({
          examId: { $in: summarized.map(function (e) { return e._id; }) },
          studentEmail: req.user.email,
        });
        var myResultMap = {};
        myResults.forEach(function (r) {
          myResultMap[r.examId.toString()] = r;
        });
        summarized = summarized.map(function (e) {
          var mine = myResultMap[e._id.toString()];
          e.myCompletionStatus = mine ? mine.completionStatus : "Not Attempted";
          e.myObtainedMarks = mine ? mine.obtainedMarks : null;
          e.myPercentage = mine ? mine.percentage : null;
          e.myPassStatus = mine ? mine.passStatus : null;
          return e;
        });
      }

      return res.status(200).json({
        success: true,
        exams: summarized,
        total: totalExams,
        page: page,
        totalPages: Math.ceil(totalExams / limit) || 1,
      });
    } catch (error) {
      console.error("Error fetching exams:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  getExamById: async function (req, res) {
    try {
      var exam = await Exam.findById(req.params.id);
      if (!exam) {
        return res.status(404).json({ success: false, message: "Exam not found" });
      }
      var summary = toExamSummary(exam);

      var role = req.user.role;
      if (role === "Student" || role === "Employee") {
        if (summary.effectiveStatus === "Draft" || summary.effectiveStatus === "Unpublished") {
          return res.status(403).json({ success: false, message: "This exam is not available." });
        }
        if (exam.batchId) {
          var batchCheck = await Batch.findById(exam.batchId).select("students");
          if (!isStudentInBatch(batchCheck, req.user.email)) {
            return res.status(403).json({ success: false, message: "You are not enrolled in the batch for this exam." });
          }
        }
        summary.questions = summary.questions.map(function (q) {
          return { questionText: q.questionText, options: q.options, marks: q.marks };
        });
        var myResult = await ExamResult.findOne({ examId: exam._id, studentEmail: req.user.email });
        summary.myCompletionStatus = myResult ? myResult.completionStatus : "Not Attempted";
      }

      return res.status(200).json({ success: true, exam: summary });
    } catch (error) {
      console.error("Error fetching exam:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  createExam: async function (req, res) {
    try {
      var title = req.body.title;
      if (!title || title.trim() === "") {
        return res.status(400).json({ success: false, message: "Exam name is required" });
      }
      var examDate = req.body.examDate;
      if (!examDate) {
        return res.status(400).json({ success: false, message: "Exam date is required" });
      }
      var duration = parseInt(req.body.duration, 10);
      if (!duration || duration <= 0) {
        return res.status(400).json({ success: false, message: "Duration must be a positive number of minutes" });
      }
      var totalMarks = parseInt(req.body.totalMarks, 10);
      if (!totalMarks || totalMarks <= 0) {
        return res.status(400).json({ success: false, message: "Total marks must be a positive number" });
      }
      var passingMarks = parseInt(req.body.passingMarks, 10);
      if (req.body.passingMarks === undefined || isNaN(passingMarks) || passingMarks < 0) {
        return res.status(400).json({ success: false, message: "Passing marks are required" });
      }
      if (passingMarks > totalMarks) {
        return res.status(400).json({ success: false, message: "Passing marks cannot exceed total marks" });
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
      var questions = Array.isArray(req.body.questions) ? req.body.questions : [];
      var newExam = new Exam({
        title: title.trim(),
        courseId: courseId,
        courseName: courseName,
        batchId: batchId,
        batchName: batchName,
        examDate: examDate,
        duration: duration,
        totalMarks: totalMarks,
        passingMarks: passingMarks,
        instructions: req.body.instructions || "",
        questions: questions,
        status: "Draft",
        createdByEmail: req.user.email,
        createdByName: req.user.firstName || "",
      });
      await newExam.save();
      return res.status(201).json({ success: true, message: "Exam created successfully", exam: toExamSummary(newExam) });
    } catch (error) {
      console.error("Error creating exam:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  updateExam: async function (req, res) {
    try {
      var exam = await Exam.findById(req.params.id);
      if (!exam) {
        return res.status(404).json({ success: false, message: "Exam not found" });
      }

      if (req.body.title !== undefined) {
        if (req.body.title.trim() === "") {
          return res.status(400).json({ success: false, message: "Exam name is required" });
        }
        exam.title = req.body.title.trim();
      }
      if (req.body.examDate !== undefined) exam.examDate = req.body.examDate;
      if (req.body.duration !== undefined) exam.duration = parseInt(req.body.duration, 10);
      if (req.body.totalMarks !== undefined) exam.totalMarks = parseInt(req.body.totalMarks, 10);
      if (req.body.passingMarks !== undefined) exam.passingMarks = parseInt(req.body.passingMarks, 10);
      if (exam.passingMarks > exam.totalMarks) {
        return res.status(400).json({ success: false, message: "Passing marks cannot exceed total marks" });
      }
      if (req.body.instructions !== undefined) exam.instructions = req.body.instructions;
      if (req.body.questions !== undefined) exam.questions = req.body.questions;

      if (req.body.courseId !== undefined) {
        if (req.body.courseId) {
          var course = await Course.findById(req.body.courseId);
          if (!course) {
            return res.status(400).json({ success: false, message: "Selected course was not found" });
          }
          exam.courseId = course._id;
          exam.courseName = course.title;
        } else {
          exam.courseId = null;
          exam.courseName = "";
        }
      }
      if (req.body.batchId !== undefined) {
        if (req.body.batchId) {
          var batch = await Batch.findById(req.body.batchId);
          if (!batch) {
            return res.status(400).json({ success: false, message: "Selected batch was not found" });
          }
          exam.batchId = batch._id;
          exam.batchName = batch.name;
        } else {
          exam.batchId = null;
          exam.batchName = "";
        }
      }

      await exam.save();
      return res.status(200).json({ success: true, message: "Exam updated successfully", exam: toExamSummary(exam) });
    } catch (error) {
      console.error("Error updating exam:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  deleteExam: async function (req, res) {
    try {
      var exam = await Exam.findById(req.params.id);
      if (!exam) {
        return res.status(404).json({ success: false, message: "Exam not found" });
      }
      await ExamResult.deleteMany({ examId: exam._id });
      await Exam.findByIdAndDelete(req.params.id);
      return res.status(200).json({ success: true, message: "Exam deleted successfully" });
    } catch (error) {
      console.error("Error deleting exam:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  publishExam: async function (req, res) {
    try {
      var exam = await Exam.findById(req.params.id);
      if (!exam) {
        return res.status(404).json({ success: false, message: "Exam not found" });
      }
      if (!exam.questions || exam.questions.length === 0) {
        return res.status(400).json({ success: false, message: "Add at least one question before publishing" });
      }
      exam.status = "Published";
      await exam.save();

      if (exam.batchName) {
        try {
          await Notification.create({
            title: "New Exam: " + exam.title,
            message:
              "A new exam \"" + exam.title + "\" has been scheduled on " +
              new Date(exam.examDate).toLocaleString() + " (" + exam.duration + " min, " +
              exam.totalMarks + " marks). Check My Exams to take it.",
            recipientType: "Batch",
            batchName: exam.batchName,
            senderId: req.user.email,
            senderRole: req.user.role,
            priority: "High",
          });
        } catch (notifyError) {
          console.error("Error creating exam publish notification:", notifyError);
        }
      }

      return res.status(200).json({ success: true, message: "Exam published. Students can now access it.", exam: toExamSummary(exam) });
    } catch (error) {
      console.error("Error publishing exam:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  unpublishExam: async function (req, res) {
    try {
      var exam = await Exam.findById(req.params.id);
      if (!exam) {
        return res.status(404).json({ success: false, message: "Exam not found" });
      }
      exam.status = "Unpublished";
      await exam.save();
      return res.status(200).json({ success: true, message: "Exam unpublished. Students can no longer access it.", exam: toExamSummary(exam) });
    } catch (error) {
      console.error("Error unpublishing exam:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  getResultSummary: async function (req, res) {
    try {
      var exam = await Exam.findById(req.params.id);
      if (!exam) {
        return res.status(404).json({ success: false, message: "Exam not found" });
      }
      var results = await ExamResult.find({ examId: exam._id }).sort({ obtainedMarks: -1 });

      var roster = [];
      if (exam.batchId) {
        var batch = await Batch.findById(exam.batchId);
        if (batch) {
          roster = batch.students || [];
        }
      }
      var resultMap = {};
      results.forEach(function (r) {
        resultMap[r.studentEmail] = r;
      });
      var summary = roster.map(function (student) {
        var r = resultMap[student.studentEmail];
        if (r) {
          return {
            studentEmail: r.studentEmail,
            studentName: r.studentName,
            totalMarks: r.totalMarks,
            obtainedMarks: r.obtainedMarks,
            percentage: r.percentage,
            grade: r.grade,
            passStatus: r.passStatus,
            completionStatus: r.completionStatus,
            submittedAt: r.submittedAt,
          };
        }
        return {
          studentEmail: student.studentEmail,
          studentName: student.studentName,
          totalMarks: exam.totalMarks,
          obtainedMarks: 0,
          percentage: 0,
          grade: "-",
          passStatus: "Fail",
          completionStatus: "Not Attempted",
          submittedAt: null,
        };
      });
      results.forEach(function (r) {
        var alreadyListed = summary.some(function (s) {
          return s.studentEmail === r.studentEmail;
        });
        if (!alreadyListed) {
          summary.push({
            studentEmail: r.studentEmail,
            studentName: r.studentName,
            totalMarks: r.totalMarks,
            obtainedMarks: r.obtainedMarks,
            percentage: r.percentage,
            grade: r.grade,
            passStatus: r.passStatus,
            completionStatus: r.completionStatus,
            submittedAt: r.submittedAt,
          });
        }
      });

      return res.status(200).json({ success: true, exam: toExamSummary(exam), results: summary });
    } catch (error) {
      console.error("Error fetching result summary:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  submitExam: async function (req, res) {
    try {
      var exam = await Exam.findById(req.params.id);
      if (!exam) {
        return res.status(404).json({ success: false, message: "Exam not found" });
      }
      var summary = toExamSummary(exam);
      if (summary.effectiveStatus !== "Ongoing") {
        return res.status(400).json({
          success: false,
          message:
            summary.effectiveStatus === "Published"
              ? "This exam has not started yet."
              : summary.effectiveStatus === "Completed"
                ? "This exam window has closed."
                : "This exam is not currently open for submission.",
        });
      }
      if (exam.batchId) {
        var batch = await Batch.findById(exam.batchId).select("students");
        if (!isStudentInBatch(batch, req.user.email)) {
          return res.status(403).json({ success: false, message: "You are not enrolled in the batch for this exam." });
        }
      }
      var existing = await ExamResult.findOne({ examId: exam._id, studentEmail: req.user.email });
      if (existing && existing.completionStatus === "Completed") {
        return res.status(400).json({ success: false, message: "You have already submitted this exam." });
      }

      var submittedAnswers = Array.isArray(req.body.answers) ? req.body.answers : [];
      var obtainedMarks = 0;
      var gradedAnswers = exam.questions.map(function (q, idx) {
        var found = submittedAnswers.find(function (a) {
          return a && a.questionIndex === idx;
        });
        var selectedOption = found && typeof found.selectedOption === "number" ? found.selectedOption : -1;
        if (selectedOption === q.correctOption) {
          obtainedMarks += q.marks || 1;
        }
        return { questionIndex: idx, selectedOption: selectedOption };
      });

      var percentage = exam.totalMarks > 0 ? Math.round((obtainedMarks / exam.totalMarks) * 1000) / 10 : 0;
      var passStatus = obtainedMarks >= exam.passingMarks ? "Pass" : "Fail";
      var grade = computeGrade(percentage);
      var studentName = (req.user.firstName || "") + (req.user.lastName ? " " + req.user.lastName : "");
      var update = {
        studentName: studentName.trim(),
        totalMarks: exam.totalMarks,
        obtainedMarks: obtainedMarks,
        percentage: percentage,
        grade: grade,
        passStatus: passStatus,
        completionStatus: "Completed",
        submittedAt: new Date(),
        answers: gradedAnswers,
      };

      var result = await ExamResult.findOneAndUpdate(
        { examId: exam._id, studentEmail: req.user.email },
        { $set: update, $setOnInsert: { examId: exam._id, studentEmail: req.user.email } },
        { new: true, upsert: true },
      );

      return res.status(200).json({ success: true, message: "Exam submitted successfully", result: result });
    } catch (error) {
      console.error("Error submitting exam:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  upsertResult: async function (req, res) {
    try {
      var exam = await Exam.findById(req.params.id);
      if (!exam) {
        return res.status(404).json({ success: false, message: "Exam not found" });
      }
      var studentEmail = req.body.studentEmail;
      if (!studentEmail) {
        return res.status(400).json({ success: false, message: "studentEmail is required" });
      }
      var existing = await ExamResult.findOne({ examId: exam._id, studentEmail: studentEmail });
      if (!existing || existing.completionStatus !== "Completed") {
        return res.status(400).json({
          success: false,
          message: "This student has not submitted the exam yet, so there is no result to adjust.",
        });
      }
      var obtainedMarks = parseFloat(req.body.obtainedMarks);
      if (isNaN(obtainedMarks) || obtainedMarks < 0) {
        return res.status(400).json({ success: false, message: "obtainedMarks must be a non-negative number" });
      }
      if (obtainedMarks > exam.totalMarks) {
        return res.status(400).json({ success: false, message: "obtainedMarks cannot exceed the exam's total marks" });
      }

      var percentage = exam.totalMarks > 0 ? Math.round((obtainedMarks / exam.totalMarks) * 1000) / 10 : 0;
      var passStatus = obtainedMarks >= exam.passingMarks ? "Pass" : "Fail";
      var grade = computeGrade(percentage);
      existing.obtainedMarks = obtainedMarks;
      existing.percentage = percentage;
      existing.grade = grade;
      existing.passStatus = passStatus;
      existing.gradedBy = req.user.email;
      await existing.save();

      return res.status(200).json({ success: true, message: "Result adjusted successfully", result: existing });
    } catch (error) {
      console.error("Error saving exam result:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  getMyResult: async function (req, res) {
    try {
      var result = await ExamResult.findOne({ examId: req.params.id, studentEmail: req.user.email });
      if (!result) {
        return res.status(200).json({
          success: true,
          result: { completionStatus: "Not Attempted", obtainedMarks: 0, percentage: 0, grade: "-", passStatus: "Fail" },
        });
      }
      return res.status(200).json({ success: true, result: result });
    } catch (error) {
      console.error("Error fetching student result:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  getAnalytics: async function (req, res) {
    try {
      var exam = await Exam.findById(req.params.id);
      if (!exam) {
        return res.status(404).json({ success: false, message: "Exam not found" });
      }

      var totalStudents = 0;
      if (exam.batchId) {
        var batch = await Batch.findById(exam.batchId);
        totalStudents = batch && batch.students ? batch.students.length : 0;
      }
      var results = await ExamResult.find({ examId: exam._id });
      var attempted = results.filter(function (r) {
        return r.completionStatus === "Completed";
      });
      var attemptedCount = attempted.length;
      var totalScore = 0;
      var highest = attemptedCount > 0 ? -Infinity : 0;
      var lowest = attemptedCount > 0 ? Infinity : 0;
      var passCount = 0;
      var scoreBuckets = { "0-25%": 0, "26-50%": 0, "51-75%": 0, "76-100%": 0 };

      attempted.forEach(function (r) {
        totalScore += r.obtainedMarks;
        if (r.obtainedMarks > highest) highest = r.obtainedMarks;
        if (r.obtainedMarks < lowest) lowest = r.obtainedMarks;
        if (r.passStatus === "Pass") passCount += 1;

        if (r.percentage <= 25) scoreBuckets["0-25%"] += 1;
        else if (r.percentage <= 50) scoreBuckets["26-50%"] += 1;
        else if (r.percentage <= 75) scoreBuckets["51-75%"] += 1;
        else scoreBuckets["76-100%"] += 1;
      });

      var averageScore = attemptedCount > 0 ? Math.round((totalScore / attemptedCount) * 10) / 10 : 0;
      var passPercentage = attemptedCount > 0 ? Math.round((passCount / attemptedCount) * 1000) / 10 : 0;
      var failPercentage = attemptedCount > 0 ? Math.round(1000 - passPercentage * 10) / 10 : 0;
      var completionRate = totalStudents > 0 ? Math.round((attemptedCount / totalStudents) * 1000) / 10 : 0;

      return res.status(200).json({
        success: true,
        exam: toExamSummary(exam),
        analytics: {
          totalStudents: totalStudents,
          attemptedCount: attemptedCount,
          notAttemptedCount: Math.max(totalStudents - attemptedCount, 0),
          averageScore: averageScore,
          highestScore: attemptedCount > 0 ? highest : 0,
          lowestScore: attemptedCount > 0 ? lowest : 0,
          passCount: passCount,
          failCount: attemptedCount - passCount,
          passPercentage: passPercentage,
          failPercentage: failPercentage,
          completionRate: completionRate,
          scoreDistribution: scoreBuckets,
        },
      });
    } catch (error) {
      console.error("Error building exam analytics:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
};

module.exports = examController;
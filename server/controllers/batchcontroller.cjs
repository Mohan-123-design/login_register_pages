var Batch = require("../models/batch.cjs");
var User = require("../models/user.cjs");
var Course = require("../models/course.cjs");
var Assignment = require("../models/assignment.cjs");
var Exam = require("../models/exam.cjs");

function toStudentSummary(batch) {
  var obj = batch.toObject ? batch.toObject() : batch;
  obj.studentCount = obj.students ? obj.students.length : 0;
  return obj;
}

var batchController = {
  getAllBatches: async function (req, res) {
    try {
      var search = req.query.search || "";
      var status = req.query.status || "";
      var trainerEmail = req.query.trainer || "";
      var courseId = req.query.courseId || "";
      var page = parseInt(req.query.page, 10) || 1;
      var limit = parseInt(req.query.limit, 10) || 10;
      var query = {};
      if (search.trim() !== "") {
        var regex = new RegExp(search.trim(), "i");
        query.$or = [{ name: regex }, { code: regex }, { trainerName: regex }, { courseName: regex }];
      }
      if (status !== "") query.status = status;
      if (trainerEmail !== "") query.trainerEmail = trainerEmail;
      if (courseId !== "") query.courseId = courseId;
      var totalBatches = await Batch.countDocuments(query);
      var batches = await Batch.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      var batchesWithCount = batches.map(toStudentSummary);
      return res.status(200).json({
        success: true,
        batches: batchesWithCount,
        total: totalBatches,
        page: page,
        totalPages: Math.ceil(totalBatches / limit) || 1,
      });
    } catch (error) {
      console.error("Error fetching batches:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  getBatchStats: async function (req, res) {
    try {
      var totalBatches = await Batch.countDocuments({});
      var activeBatches = await Batch.countDocuments({ status: "Active" });
      var upcomingBatches = await Batch.countDocuments({ status: "Upcoming" });
      var completedBatches = await Batch.countDocuments({ status: "Completed" });
      var archivedBatches = await Batch.countDocuments({ status: "Archived" });
      var unassignedTrainerBatches = await Batch.countDocuments({
        $or: [{ trainerEmail: "" }, { trainerEmail: { $exists: false } }],
      });
      var allBatches = await Batch.find({}).select("students capacity trainerEmail trainerName");
      var totalAllocatedStudents = 0;
      var totalCapacity = 0;
      var fullBatches = 0;
      var trainerCountMap = {};

      for (var i = 0; i < allBatches.length; i++) {
        var b = allBatches[i];
        var studentCount = b.students ? b.students.length : 0;
        totalAllocatedStudents += studentCount;
        totalCapacity += b.capacity || 0;
        if (b.capacity > 0 && studentCount >= b.capacity) {
          fullBatches += 1;
        }
        if (b.trainerEmail && b.trainerEmail !== "") {
          var key = b.trainerEmail;
          if (!trainerCountMap[key]) {
            trainerCountMap[key] = { trainerEmail: b.trainerEmail, trainerName: b.trainerName, batchCount: 0 };
          }
          trainerCountMap[key].batchCount += 1;
        }
      }

      var batchesPerTrainer = Object.keys(trainerCountMap).map(function (key) {
        return trainerCountMap[key];
      });
      batchesPerTrainer.sort(function (a, b) {
        return b.batchCount - a.batchCount;
      });
      var averageBatchSize = totalBatches > 0 ? Math.round((totalAllocatedStudents / totalBatches) * 10) / 10 : 0;
      var capacityUtilization = totalCapacity > 0 ? Math.round((totalAllocatedStudents / totalCapacity) * 1000) / 10 : 0;
      return res.status(200).json({
        success: true,
        stats: {
          totalBatches: totalBatches,
          activeBatches: activeBatches,
          upcomingBatches: upcomingBatches,
          completedBatches: completedBatches,
          archivedBatches: archivedBatches,
          unassignedTrainerBatches: unassignedTrainerBatches,
          totalAllocatedStudents: totalAllocatedStudents,
          averageBatchSize: averageBatchSize,
          capacityUtilization: capacityUtilization,
          fullBatches: fullBatches,
          batchesPerTrainer: batchesPerTrainer,
        },
      });
    } catch (error) {
      console.error("Error building batch statistics:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  getBatchById: async function (req, res) {
    try {
      var batch = await Batch.findById(req.params.id);
      if (!batch) {
        return res.status(404).json({ success: false, message: "Batch not found" });
      }
      var studentEmails = batch.students.map(function (s) {
        return s.studentEmail;
      });
      var studentDocs = await User.find({ email: { $in: studentEmails } }).select(
        "firstName lastName email status batch",
      );
      var studentMap = {};
      for (var i = 0; i < studentDocs.length; i++) {
        studentMap[studentDocs[i].email] = studentDocs[i];
      }
      var enrolledStudents = batch.students.map(function (s) {
        var userDoc = studentMap[s.studentEmail];
        return {
          email: s.studentEmail,
          name: s.studentName,
          allocatedAt: s.allocatedAt,
          status: userDoc ? userDoc.status : "Unknown",
          firstName: userDoc ? userDoc.firstName : "",
          lastName: userDoc ? userDoc.lastName : "",
        };
      });
      var batchObj = toStudentSummary(batch);
      return res.status(200).json({
        success: true,
        batch: batchObj,
        enrolledStudents: enrolledStudents,
        enrolledCount: enrolledStudents.length,
        seatsRemaining: batch.capacity > 0 ? Math.max(batch.capacity - enrolledStudents.length, 0) : null,
      });
    } catch (error) {
      console.error("Error fetching batch:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  createBatch: async function (req, res) {
    try {
      var name = req.body.name;
      if (!name || name.trim() === "") {
        return res.status(400).json({ success: false, message: "Batch name is required" });
      }
      var existingBatch = await Batch.findOne({ name: name.trim() });
      if (existingBatch) {
        return res.status(409).json({ success: false, message: "A batch with this name already exists" });
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
      var trainerEmail = req.body.trainerEmail || "";
      var trainerName = "";
      if (trainerEmail !== "") {
        var trainer = await User.findOne({ email: trainerEmail, role: "Trainer" });
        if (!trainer) {
          return res.status(400).json({ success: false, message: "Selected trainer was not found" });
        }
        trainerName = trainer.firstName + " " + trainer.lastName;
      }
      var newBatch = new Batch({
        name: name.trim(),
        code: req.body.code || "",
        courseId: courseId,
        courseName: courseName,
        trainerEmail: trainerEmail,
        trainerName: trainerName,
        startDate: req.body.startDate || null,
        endDate: req.body.endDate || null,
        schedule: req.body.schedule || "",
        capacity: req.body.capacity ? parseInt(req.body.capacity, 10) : 30,
        status: req.body.status || "Upcoming",
        students: [],
      });
      await newBatch.save();
      return res.status(201).json({ success: true, message: "Batch created successfully", batch: newBatch });
    } catch (error) {
      console.error("Error creating batch:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

updateBatch: async function (req, res) {
    try {
      var batch = await Batch.findById(req.params.id);
      if (!batch) {
        return res.status(404).json({ success: false, message: "Batch not found" });
      }
      var previousBatchName = batch.name;
      if (req.body.name !== undefined) {
        if (req.body.name.trim() === "") {
          return res.status(400).json({ success: false, message: "Batch name cannot be empty" });
        }
        var duplicateBatch = await Batch.findOne({ name: req.body.name.trim(), _id: { $ne: batch._id } });
        if (duplicateBatch) {
          return res.status(409).json({ success: false, message: "A batch with this name already exists" });
        }
        batch.name = req.body.name.trim();
      }
      if (req.body.code !== undefined) batch.code = req.body.code;
      if (req.body.schedule !== undefined) batch.schedule = req.body.schedule;
      if (req.body.startDate !== undefined) batch.startDate = req.body.startDate;
      if (req.body.endDate !== undefined) batch.endDate = req.body.endDate;
      if (req.body.capacity !== undefined) {
        var newCapacity = parseInt(req.body.capacity, 10);
        if (isNaN(newCapacity) || newCapacity < 0) {
          return res.status(400).json({ success: false, message: "Capacity must be a positive number" });
        }
        if (newCapacity > 0 && newCapacity < batch.students.length) {
          return res.status(400).json({
            success: false,
            message: "Capacity cannot be less than the number of students already allocated (" + batch.students.length + ")",
          });
        }
        batch.capacity = newCapacity;
      }
      if (req.body.status !== undefined) {
        var allowedStatuses = ["Upcoming", "Active", "Completed", "Archived"];
        if (allowedStatuses.indexOf(req.body.status) === -1) {
          return res.status(400).json({ success: false, message: "Invalid status value" });
        }
        batch.status = req.body.status;
      }
      if (req.body.courseId !== undefined) {
        if (req.body.courseId === "" || req.body.courseId === null) {
          batch.courseId = null;
          batch.courseName = "";
        } else {
          var course = await Course.findById(req.body.courseId);
          if (!course) {
            return res.status(400).json({ success: false, message: "Selected course was not found" });
          }
          batch.courseId = course._id;
          batch.courseName = course.title;
        }
      }
      if (req.body.trainerEmail !== undefined) {
        if (req.body.trainerEmail === "") {
          batch.trainerEmail = "";
          batch.trainerName = "";
        } else {
          var trainer = await User.findOne({ email: req.body.trainerEmail, role: "Trainer" });
          if (!trainer) {
            return res.status(400).json({ success: false, message: "Selected trainer was not found" });
          }
          batch.trainerEmail = trainer.email;
          batch.trainerName = trainer.firstName + " " + trainer.lastName;
        }
      }
      await batch.save();

      if (previousBatchName !== batch.name) {
        var allocatedEmails = batch.students.map(function (s) {
          return s.studentEmail;
        });
        if (allocatedEmails.length > 0) {
          await User.updateMany(
            { email: { $in: allocatedEmails }, batch: previousBatchName },
            { $set: { batch: batch.name } },
          );
        }
        // Keep already-created assignments/exams in sync too, since their
        // notifications were sent using a snapshot of the batch name.
        await Assignment.updateMany({ batchId: batch._id }, { $set: { batchName: batch.name } });
        await Exam.updateMany({ batchId: batch._id }, { $set: { batchName: batch.name } });
      }

      return res.status(200).json({ success: true, message: "Batch updated successfully", batch: batch });
    } catch (error) {
      console.error("Error updating batch:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  
  assignTrainer: async function (req, res) {
    try {
      var trainerEmail = req.body.trainerEmail;
      var batch = await Batch.findById(req.params.id);
      if (!batch) {
        return res.status(404).json({ success: false, message: "Batch not found" });
      }
      if (!trainerEmail || trainerEmail.trim() === "") {
        batch.trainerEmail = "";
        batch.trainerName = "";
        await batch.save();
        return res.status(200).json({ success: true, message: "Trainer unassigned successfully", batch: batch });
      }
      var trainer = await User.findOne({ email: trainerEmail, role: "Trainer" });
      if (!trainer) {
        return res.status(404).json({ success: false, message: "Trainer not found" });
      }
      batch.trainerEmail = trainer.email;
      batch.trainerName = trainer.firstName + " " + trainer.lastName;
      await batch.save();
      return res.status(200).json({
        success: true,
        message: "Trainer assigned successfully",
        batch: batch,
      });
    } catch (error) {
      console.error("Error assigning trainer:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

updateStatus: async function (req, res) {
  try {
    var newStatus = req.body.status;
    var allowedStatuses = ["Upcoming", "Active", "Completed", "Archived"];
    if (allowedStatuses.indexOf(newStatus) === -1) {
      return res.status(400).json({ success: false, message: "status must be one of: " + allowedStatuses.join(", ") });
    }
    var batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }
    batch.status = newStatus;
    await batch.save();
    return res.status(200).json({
      success: true,
      message: "Batch status updated to " + newStatus,
      batch: batch,
    });
  } catch (error) {
    console.error("Error updating batch status:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
},

getAvailableStudents: async function (req, res) {
  try {
    var batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }
    var search = req.query.search || "";
    var allocatedEmails = batch.students.map(function (s) {
      return s.studentEmail;
    });
    var query = {
      role: { $in: ["Student", "Employee"] },
      email: { $nin: allocatedEmails },
    };
    if (search.trim() !== "") {
      var regex = new RegExp(search.trim(), "i");
      query.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
    }
    var availableStudents = await User.find(query)
      .select("firstName lastName email batch status")
      .limit(200);
    return res.status(200).json({ success: true, students: availableStudents });
  } catch (error) {
    console.error("Error fetching available students:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
},

allocateStudents: async function (req, res) {
  try {
    var studentEmails = req.body.studentEmails;
    if (!Array.isArray(studentEmails) || studentEmails.length === 0) {
      return res.status(400).json({ success: false, message: "studentEmails must be a non-empty array" });
    }
    var batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }
    var existingEmails = batch.students.map(function (s) {
      return s.studentEmail;
    });
    var newEmails = [];
    for (var i = 0; i < studentEmails.length; i++) {
      if (existingEmails.indexOf(studentEmails[i]) === -1 && newEmails.indexOf(studentEmails[i]) === -1) {
        newEmails.push(studentEmails[i]);
      }
    }
    if (newEmails.length === 0) {
      return res.status(400).json({ success: false, message: "Selected students are already allocated to this batch" });
    }
    if (batch.capacity > 0 && batch.students.length + newEmails.length > batch.capacity) {
      var seatsLeft = batch.capacity - batch.students.length;
      return res.status(400).json({
        success: false,
        message: "Not enough seats available. Only " + Math.max(seatsLeft, 0) + " seat(s) remaining in this batch.",
      });
    }
    var studentDocs = await User.find({
      email: { $in: newEmails },
      role: { $in: ["Student", "Employee"] },
    });
    if (studentDocs.length !== newEmails.length) {
      return res.status(400).json({ success: false, message: "One or more selected students were not found" });
    }
    for (var j = 0; j < studentDocs.length; j++) {
      var studentDoc = studentDocs[j];
      batch.students.push({
        studentEmail: studentDoc.email,
        studentName: studentDoc.firstName + " " + studentDoc.lastName,
        allocatedAt: new Date(),
      });
      studentDoc.batch = batch.name;
      await studentDoc.save();
    }
    await batch.save();
    return res.status(200).json({
      success: true,
      message: studentDocs.length + " student(s) allocated to batch successfully",
      batch: batch,
    });
  } catch (error) {
    console.error("Error allocating students:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
},

removeStudent: async function (req, res) {
  try {
    var batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }
    var studentEmail = decodeURIComponent(req.params.email);
    var originalLength = batch.students.length;
    batch.students = batch.students.filter(function (s) {
      return s.studentEmail !== studentEmail;
    });
    if (batch.students.length === originalLength) {
      return res.status(404).json({ success: false, message: "Student not found in this batch" });
    }
    await batch.save();
    var studentDoc = await User.findOne({ email: studentEmail });
    if (studentDoc && studentDoc.batch === batch.name) {
      studentDoc.batch = "";
      await studentDoc.save();
    }
    return res.status(200).json({ success: true, message: "Student removed from batch successfully", batch: batch });
  } catch (error) {
    console.error("Error removing student from batch:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
},

deleteBatch: async function (req, res) {
  try {
    var batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }
    var allocatedEmails = batch.students.map(function (s) {
      return s.studentEmail;
    });
    if (allocatedEmails.length > 0) {
      await User.updateMany(
        { email: { $in: allocatedEmails }, batch: batch.name },
        { $set: { batch: "" } },
      );
    }
    await Batch.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Batch deleted successfully" });
  } catch (error) {
    console.error("Error deleting batch:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
},
};

module.exports = batchController;
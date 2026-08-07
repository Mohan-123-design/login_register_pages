var Course = require("../models/course.cjs");
var User = require("../models/user.cjs");
var Batch = require("../models/batch.cjs");
var courseManagementController = {
  getAllCourses: async function (req, res) {
    try {
      var search = req.query.search || "";
      var status = req.query.status || "";
      var batch = req.query.batch || "";
      var trainerEmail = req.query.trainer || "";
      var page = parseInt(req.query.page, 10) || 1;
      var limit = parseInt(req.query.limit, 10) || 10;
      var query = {};
      if (search.trim() !== "") {
        var regex = new RegExp(search.trim(), "i");
        query.$or = [{ title: regex }, { code: regex }, { trainerName: regex }, { batch: regex }];
      }
      if (status !== "") query.status = status;
      if (batch !== "") query.batch = batch;
      if (trainerEmail !== "") query.trainerEmail = trainerEmail;

var totalCourses = await Course.countDocuments(query);
      var courses = await Course.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      // Batch.courseId is now the real link (Course.batch is intentionally
      // always "" - see createCourse/updateCourse). Look up linked batch
      // names per course so the list view can display them.
      var courseIds = courses.map(function (c) { return c._id; });
      var linkedBatches = await Batch.find({ courseId: { $in: courseIds } }).select("name courseId");
      var batchNameMap = {};
      linkedBatches.forEach(function (b) {
        var key = b.courseId.toString();
        if (!batchNameMap[key]) batchNameMap[key] = [];
        batchNameMap[key].push(b.name);
      });
      var coursesWithBatches = courses.map(function (c) {
        var obj = c.toObject();
        obj.linkedBatchNames = batchNameMap[c._id.toString()] || [];
        return obj;
      });

      return res.status(200).json({
        success: true,
        courses: coursesWithBatches,        total: totalCourses,
        page: page,
        totalPages: Math.ceil(totalCourses / limit) || 1,
      });
    } catch (error) {
      console.error("Error fetching courses:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  getCourseStats: async function (req, res) {
    try {
      var totalCourses = await Course.countDocuments({});
      var activeCourses = await Course.countDocuments({ status: "Active" });
      var archivedCourses = await Course.countDocuments({ status: "Archived" });
      var unassignedCourses = await Course.countDocuments({
        $or: [{ trainerEmail: "" }, { trainerEmail: { $exists: false } }],
      });

      var perTrainerAgg = await Course.aggregate([
        { $match: { trainerEmail: { $ne: "" } } },
        {
          $group: {
            _id: { email: "$trainerEmail", name: "$trainerName" },
            courseCount: { $sum: 1 },
          },
        },
        { $sort: { courseCount: -1 } },
      ]);
      var coursesPerTrainer = perTrainerAgg.map(function (row) {
        return {
          trainerEmail: row._id.email,
          trainerName: row._id.name,
          courseCount: row.courseCount,
        };
      });

      var perBatchAgg = await Course.aggregate([
        { $match: { batch: { $ne: "" } } },
        { $group: { _id: "$batch", courseCount: { $sum: 1 } } },
        { $sort: { courseCount: -1 } },
      ]);
      var coursesPerBatch = perBatchAgg.map(function (row) {
        return { batch: row._id, courseCount: row.courseCount };
      });

      var allBatches = await Course.distinct("batch", { batch: { $ne: "" } });
      var totalEnrolledStudents = await User.countDocuments({
        batch: { $in: allBatches },
        role: { $in: ["Student", "Employee"] },
      });

      return res.status(200).json({
        success: true,
        stats: {
          totalCourses: totalCourses,
          activeCourses: activeCourses,
          archivedCourses: archivedCourses,
          unassignedCourses: unassignedCourses,
          totalEnrolledStudents: totalEnrolledStudents,
          coursesPerTrainer: coursesPerTrainer,
          coursesPerBatch: coursesPerBatch,
        },
      });
    } catch (error) {
      console.error("Error building course statistics:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  getCourseById: async function (req, res) {
    try {
      var course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }
      var enrolledMap = {};

      if (course.batch) {
        var legacyStudents = await User.find({
          batch: course.batch,
          role: { $in: ["Student", "Employee"] },
        }).select("firstName lastName email batch status");
        for (var i = 0; i < legacyStudents.length; i++) {
          enrolledMap[legacyStudents[i].email] = legacyStudents[i];
        }
      }

      var linkedBatches = await Batch.find({ courseId: course._id }).select("students");
      var linkedEmails = [];
      for (var j = 0; j < linkedBatches.length; j++) {
        for (var k = 0; k < linkedBatches[j].students.length; k++) {
          linkedEmails.push(linkedBatches[j].students[k].studentEmail);
        }
      }
      if (linkedEmails.length > 0) {
        var batchLinkedStudents = await User.find({ email: { $in: linkedEmails } }).select(
          "firstName lastName email batch status",
        );
        for (var m = 0; m < batchLinkedStudents.length; m++) {
          enrolledMap[batchLinkedStudents[m].email] = batchLinkedStudents[m];
        }
      }

var enrolledStudents = Object.keys(enrolledMap).map(function (email) {
        return enrolledMap[email];
      });

      var linkedBatchDocs = await Batch.find({ courseId: course._id }).select("name");
      var courseObj = course.toObject();
      courseObj.linkedBatchNames = linkedBatchDocs.map(function (b) { return b.name; });

      return res.status(200).json({
        success: true,
        course: courseObj,        enrolledStudents: enrolledStudents,
        enrolledCount: enrolledStudents.length,
      });
    } catch (error) {
      console.error("Error fetching course:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  createCourse: async function (req, res) {
    try {
      var title = req.body.title;
      if (!title || title.trim() === "") {
        return res.status(400).json({ success: false, message: "Course title is required" });
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

      var newCourse = new Course({
        title: title.trim(),
        code: req.body.code || "",
        description: req.body.description || "",
        category: req.body.category || "",
        trainerEmail: trainerEmail,
        trainerName: trainerName,
        batch: "",
        duration: req.body.duration || "",
        startDate: req.body.startDate || null,
        status: "Active",
      });
      await newCourse.save();

      return res.status(201).json({ success: true, message: "Course created successfully", course: newCourse });
    } catch (error) {
      console.error("Error creating course:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  updateCourse: async function (req, res) {
    try {
      var updates = {};
      if (req.body.title !== undefined) {
        if (req.body.title.trim() === "") {
          return res.status(400).json({ success: false, message: "Course title cannot be empty" });
        }
        updates.title = req.body.title.trim();
      }
      if (req.body.code !== undefined) updates.code = req.body.code;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.category !== undefined) updates.category = req.body.category;
      if (req.body.duration !== undefined) updates.duration = req.body.duration;
      if (req.body.startDate !== undefined) updates.startDate = req.body.startDate;
      if (req.body.trainerEmail !== undefined) {
        if (req.body.trainerEmail === "") {
          updates.trainerEmail = "";
          updates.trainerName = "";
        } else {
          var trainer = await User.findOne({ email: req.body.trainerEmail, role: "Trainer" });
          if (!trainer) {
            return res.status(400).json({ success: false, message: "Selected trainer was not found" });
          }
          updates.trainerEmail = trainer.email;
          updates.trainerName = trainer.firstName + " " + trainer.lastName;
        }
      }

      var updatedCourse = await Course.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      });

      if (!updatedCourse) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }

      return res.status(200).json({ success: true, message: "Course updated successfully", course: updatedCourse });
    } catch (error) {
      console.error("Error updating course:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  assignTrainer: async function (req, res) {
    try {
      var trainerEmail = req.body.trainerEmail;
      if (!trainerEmail || trainerEmail.trim() === "") {
        return res.status(400).json({ success: false, message: "trainerEmail is required" });
      }

      var trainer = await User.findOne({ email: trainerEmail, role: "Trainer" });
      if (!trainer) {
        return res.status(404).json({ success: false, message: "Trainer not found" });
      }

      var course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }

      course.trainerEmail = trainer.email;
      course.trainerName = trainer.firstName + " " + trainer.lastName;
      await course.save();

      return res.status(200).json({
        success: true,
        message: "Trainer assigned successfully",
        course: course,
      });
    } catch (error) {
      console.error("Error assigning trainer:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  archiveCourse: async function (req, res) {
    try {
      var newStatus = req.body.status;
      if (newStatus !== "Archived" && newStatus !== "Active") {
        return res.status(400).json({ success: false, message: 'status must be "Archived" or "Active"' });
      }

      var course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }

      course.status = newStatus;
      await course.save();

      return res.status(200).json({
        success: true,
        message: newStatus === "Archived" ? "Course archived successfully" : "Course restored successfully",
        course: course,
      });
    } catch (error) {
      console.error("Error archiving course:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  deleteCourse: async function (req, res) {
    try {
      var course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }
      await Course.findByIdAndDelete(req.params.id);
      return res.status(200).json({ success: true, message: "Course deleted successfully" });
    } catch (error) {
      console.error("Error deleting course:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
};

module.exports = courseManagementController;
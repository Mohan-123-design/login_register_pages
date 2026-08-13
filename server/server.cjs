var express = require("express");
var http = require("http");
var mongoose = require("mongoose");
var cors = require("cors");
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
var rateLimit = require("express-rate-limit");
var config = require("./config.cjs");
var attachSocket = require("./socket/index.cjs");
var activityLogController = require("./controllers/activityLogController.cjs");
var app = express();
var server = http.createServer(app);
var JWT_SECRET = config.JWT_SECRET;

app.use(cors({ origin: config.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "10mb" }));
mongoose.connect(config.MONGO_URI);

var db = mongoose.connection;
db.on("error", function (err) {
  console.log("MongoDB connection error", err);
});
db.once("open", function () {
  console.log("Connected to MongoDB database");
});

var User = require("./models/user.cjs");

var loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please try again later." },
});

app.post("/api/register", function (req, res) {
  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var email = req.body.email;
  var password = req.body.password;
  var role = req.body.role;
  if (!role) {
    role = "Student";
  }

  if (!firstName || !lastName || !email || !password) {
    return res.json({
      success: false,
      message: "First name, last name, email and password are all required",
    });
  }
  if (String(password).length < 6) {
    return res.json({
      success: false,
      message: "Password must be at least 6 characters long",
    });
  }

  User.findOne({ email: email })
    .then(function (existingUser) {
      if (existingUser) {
        return res.json({ success: false, message: "This email is already registered" });
      }
      return bcrypt.hash(password, 10).then(function (hashedPassword) {
        var newUser = new User({
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: hashedPassword,
          role: role,
        });
        return newUser.save().then(function () {
          res.json({ success: true, message: "Registration successful" });
        });
      });
    })
    .catch(function (err) {
      console.error("Register error:", err);
      res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
    });
});

app.post("/api/login", loginLimiter, function (req, res) {
  var email = req.body.email;
  var password = req.body.password;

  if (!email || !password) {
    return res.json({ success: false, message: "Email and password are required" });
  }

  User.findOne({ email: email })
    .then(function (user) {
      if (!user) {
        return res.json({
          success: false,
          message: "Email id or password is incorrect",
        });
      }
      if (user.status === "Inactive") {
        return res.json({
          success: false,
          message: "Your account is inactive. Please contact the administrator.",
        });
      }

      return bcrypt.compare(password, user.password).then(function (isMatch) {
        if (!isMatch) {
          return res.json({
            success: false,
            message: "Email id or password is incorrect",
          });
        }
        var tokenPayload = {
          email: user.email,
          role: user.role,
          firstName: user.firstName,
        };
        var token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "24h" });
        activityLogController.createLog(
          null,
          "user:login",
          { id: user.email, name: user.firstName + " " + user.lastName },
          undefined,
          { role: user.role },
        );
        res.json({
          success: true,
          message: "Login successful",
          token: token,
          user: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
          },
        });
      });
    })
    .catch(function (err) {
      console.error("Login error:", err);
      res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
    });
});

app.post("/api/check-email", function (req, res) {
  var email = req.body.email;

  User.findOne({ email: email }).then(function (user) {
    if (user) {
      res.json({
        found: true,
        message: "Verification code has been sent to your email!",
      });
    } else {
      res.json({ found: false, message: "This email is not registered" });
    }
  });
});

app.post("/api/reset-password", function (req, res) {
  var email = req.body.email;
  var newPassword = req.body.newPassword;

  User.findOne({ email: email }).then(function (user) {
    if (user) {
      user.password = newPassword;
      user.save().then(function () {
        res.json({ success: true, message: "Password updated successfully" });
      });
    } else {
      res.json({ success: false, message: "Email not found" });
    }
  });
});

function verifyToken(req, res, next) {
  var authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "No token provided. Please login first.",
    });
  }
  var token = authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Token format is wrong." });
  }
  try {
    var decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again.",
    });
  }
}

function checkRole(allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not logged in." });
    }
    var isAllowed = false;
    for (var i = 0; i < allowedRoles.length; i++) {
      if (allowedRoles[i] === req.user.role) {
        isAllowed = true;
      }
    }
    if (isAllowed === false) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not have permission.",
      });
    }
    next();
  };
}

var Attendance = require("./models/Attendance.cjs");

app.get(
  "/api/students",
  verifyToken,
  checkRole(["Trainer", "Admin"]),
  function (req, res) {
    User.find({})
      .then(function (allUsers) {
        var studentList = [];
        for (var i = 0; i < allUsers.length; i++) {
          if (allUsers[i].role === "Student" || allUsers[i].role === "Employee") {
            studentList.push({
              firstName: allUsers[i].firstName,
              lastName: allUsers[i].lastName,
              email: allUsers[i].email,
              role: allUsers[i].role,
            });
          }
        }
        res.json({ success: true, students: studentList });
      })
      .catch(function (err) {
        console.error("Get students error:", err);
        res.status(500).json({ success: false, message: "Something went wrong." });
      });
  },
);
app.get(
  "/api/attendance",
  verifyToken,
  checkRole(["Student", "Trainer", "Employee", "Admin"]),
  function (req, res) {
    var userRole = req.user.role;
    var userEmail = req.user.email;
    var dateFilter = req.query.date;

    if (userRole === "Trainer" || userRole === "Admin") {
      var query = {};
      if (dateFilter) {
        query.date = dateFilter;
      }
      Attendance.find(query)
        .then(function (records) {
          res.json({ success: true, records: records });
        })
        .catch(function (err) {
          console.error("Get attendance error:", err);
          res.status(500).json({ success: false, message: "Something went wrong." });
        });
    } else {
      var studentQuery = { studentEmail: userEmail };
      if (dateFilter) {
        studentQuery.date = dateFilter;
      }
      Attendance.find(studentQuery)
        .then(function (records) {
          res.json({ success: true, records: records });
        })
        .catch(function (err) {
          console.error("Get attendance error:", err);
          res.status(500).json({ success: false, message: "Something went wrong." });
        });
    }
  },
);
app.use(
  "/api/students",
  require("./routes/studentroutes.cjs")(verifyToken, checkRole),
);

app.use(
  "/api/attendance",
  require("./routes/attendanceRoutes.cjs")(verifyToken, checkRole),
);

app.use(
  "/api/chat",
  require("./routes/chatRoutes.cjs")(verifyToken, checkRole),
);

app.use(
  "/api/whiteboard",
  require("./routes/whiteboardRoutes.cjs")(verifyToken, checkRole),
);

app.use(
  "/api/activity-logs",
  require("./routes/activityLogRoutes.cjs")(verifyToken, checkRole),
);

app.use(
  "/api/sessions",
  require("./routes/sessionRoutes.cjs")(verifyToken, checkRole),
);
app.use(
  "/api/feedback",
  require("./routes/feedbackroutes.cjs")(verifyToken, checkRole),
);
app.use(
  "/api/notifications",
  require("./routes/notificationRoutes.cjs")(verifyToken, checkRole),
);
app.use(
  "/api/recordings",
  require("./routes/recordingroutes.cjs")(verifyToken, checkRole),
);

var io = attachSocket(server);
app.set("io", io);
app.use(
  "/api/announcements",
  require("./routes/announcementroutes.cjs")(verifyToken, checkRole),
);
app.use(
  "/api/admin/dashboard",
  require("./routes/dashboardroutes.cjs")(verifyToken, checkRole),
);
app.use(
  "/api/admin/users",
  require("./routes/usermanagementroutes.cjs")(verifyToken, checkRole),
);
app.use(
  "/api/admin/courses",
  require("./routes/coursemanagementroutes.cjs")(verifyToken, checkRole),
);
app.use(
  "/api/admin/batches",
  require("./routes/batchroutes.cjs")(verifyToken, checkRole),
);
app.use(
  "/api/admin/live-sessions",
  require("./routes/livesessionroutes.cjs")(verifyToken, checkRole),
);
app.use(
  "/api/exams",
  require("./routes/examroutes.cjs")(verifyToken, checkRole),
);
app.use(
  "/api/assignments",
  require("./routes/assignmentroutes.cjs")(verifyToken, checkRole),
);
app.use(
  "/api/certificates",
  require("./routes/certificateroutes.cjs")(verifyToken, checkRole),
);

app.use(function (req, res) {
  res.status(404).json({ success: false, message: "Route not found" });
});
// eslint-disable-next-line no-unused-vars
app.use(function (err, req, res, next) {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

server.listen(config.PORT, function () {
  console.log("Server is running on port " + config.PORT);
});
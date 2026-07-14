var express = require("express");
var mongoose = require("mongoose");
var cors = require("cors");
var jwt = require("jsonwebtoken");
var app = express();
var JWT_SECRET = "aieducation-secret-key";

app.use(cors());
app.use(express.json());
mongoose.connect("mongodb://localhost:27017/aieducation");

var db = mongoose.connection;
db.on("error", function () {
  console.log("MongoDB connection error");
});
db.once("open", function () {
  console.log("Connected to MongoDB database");
});

var userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  role: String,
});

var User = mongoose.model("User", userSchema);
app.post("/api/register", function (req, res) {
  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var email = req.body.email;
  var password = req.body.password;
  var role = req.body.role;
  if (!role) {
    role = "Student";
  }

  User.findOne({ email: email }).then(function (existingUser) {
    if (existingUser) {
      res.json({ success: false, message: "This email is already registered" });
    } else {
      var newUser = new User({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        role: role,
      });
      newUser.save().then(function () {
        res.json({ success: true, message: "Registration successful" });
      });
    }
  });
});

app.post("/api/login", function (req, res) {
  var email = req.body.email;
  var password = req.body.password;

  User.findOne({ email: email }).then(function (user) {
    if (!user) {
      res.json({
        success: false,
        message: "Email id or password is incorrect",
      });
    } else {
      if (user.password === password) {
        var tokenPayload = {
          email: user.email,
          role: user.role,
          firstName: user.firstName,
        };
        var token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "24h" });
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
      } else {
        res.json({
          success: false,
          message: "Email id or password is incorrect",
        });
      }
    }
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
  checkRole(["Teacher", "Admin"]),
  function (req, res) {
    User.find({}).then(function (allUsers) {
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
    });
  },
);
app.get(
  "/api/attendance",
  verifyToken,
  checkRole(["Student", "Teacher", "Employee", "Admin"]),
  function (req, res) {
    var userRole = req.user.role;
    var userEmail = req.user.email;
    var dateFilter = req.query.date;

    if (userRole === "Teacher" || userRole === "Admin") {
      var query = {};
      if (dateFilter) {
        query.date = dateFilter;
      }
      Attendance.find(query).then(function (records) {
        res.json({ success: true, records: records });
      });
    } else {
      var studentQuery = { studentEmail: userEmail };
      if (dateFilter) {
        studentQuery.date = dateFilter;
      }
      Attendance.find(studentQuery).then(function (records) {
        res.json({ success: true, records: records });
      });
    }
  },
);

app.use(
  "/api/attendance",
  require("./routes/attendanceRoutes.cjs")(verifyToken, checkRole),
);

app.listen(5000, function () {
  console.log("Server is running on port 5000");
});

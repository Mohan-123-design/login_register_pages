var express = require('express');
var mongoose = require('mongoose');
var cors = require('cors');
var app = express();

app.use(cors());
app.use(express.json());
mongoose.connect('mongodb://localhost:27017/aieducation');

var db = mongoose.connection;
db.on('error', function () {
  console.log('MongoDB connection error');
});
db.once('open', function () {
  console.log('Connected to MongoDB database');
});

var userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String
});

var User = mongoose.model('User', userSchema);
app.post('/api/register', function (req, res) {
  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var email = req.body.email;
  var password = req.body.password;

  User.findOne({ email: email }).then(function (existingUser) {
    if (existingUser) {
      res.json({ success: false, message: 'This email is already registered' });
    } else {
      var newUser = new User({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password
      });
      newUser.save().then(function () {
        res.json({ success: true, message: 'Registration successful' });
      });
    }
  });
});

app.post('/api/login', function (req, res) {
  var email = req.body.email;
  var password = req.body.password;

  User.findOne({ email: email }).then(function (user) {
    if (!user) {
      res.json({ success: false, message: 'Email id or password is incorrect' });
    } else {
      if (user.password === password) {
        res.json({ success: true, message: 'Login successful' });
      } else {
        res.json({ success: false, message: 'Email id or password is incorrect' });
      }
    }
  });
});

app.post('/api/check-email', function (req, res) {
  var email = req.body.email;

  User.findOne({ email: email }).then(function (user) {
    if (user) {
      res.json({ found: true, message: 'Verification code has been sent to your email!' });
    } else {
      res.json({ found: false, message: 'This email is not registered' });
    }
  });
});

app.post('/api/reset-password', function (req, res) {
  var email = req.body.email;
  var newPassword = req.body.newPassword;

  User.findOne({ email: email }).then(function (user) {
    if (user) {
      user.password = newPassword;
      user.save().then(function () {
        res.json({ success: true, message: 'Password updated successfully' });
      });
    } else {
      res.json({ success: false, message: 'Email not found' });
    }
  });
});

app.listen(5000, function () {
  console.log('Server is running on port 5000');
});

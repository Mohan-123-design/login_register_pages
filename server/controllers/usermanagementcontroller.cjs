var User = require("../models/user.cjs");
var userManagementController = {
  getAllUsers: async function (req, res) {
    try {
      var search = req.query.search || "";
      var role = req.query.role || "";
      var status = req.query.status || "";
      var page = parseInt(req.query.page, 10) || 1;
      var limit = parseInt(req.query.limit, 10) || 10;

      var query = {};
      if (search.trim() !== "") {
        var regex = new RegExp(search.trim(), "i");
        query.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
      }
      if (role !== "") query.role = role;
      if (status !== "") query.status = status;

      var totalUsers = await User.countDocuments(query);
      var users = await User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return res.status(200).json({
        success: true,
        users: users,
        total: totalUsers,
        page: page,
        totalPages: Math.ceil(totalUsers / limit) || 1,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  getUserById: async function (req, res) {
    try {
      var user = await User.findById(req.params.id).select("-password");
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      return res.status(200).json({ success: true, user: user });
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  createUser: async function (req, res) {
    try {
      var firstName = req.body.firstName;
      var lastName = req.body.lastName;
      var email = req.body.email;
      var password = req.body.password;
      var role = req.body.role || "Student";
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "firstName, lastName, email and password are required",
        });
      }

      var existingUser = await User.findOne({ email: email });
      if (existingUser) {
        return res.status(409).json({ success: false, message: "This email is already registered" });
      }

      var newUser = new User({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        role: role,
        batch: "",
        status: "Active",
      });
      await newUser.save();

      var userObj = newUser.toObject();
      delete userObj.password;

      return res.status(201).json({ success: true, message: "User created successfully", user: userObj });
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  updateUser: async function (req, res) {
    try {
      var updates = {};
      if (req.body.firstName !== undefined) updates.firstName = req.body.firstName;
      if (req.body.lastName !== undefined) updates.lastName = req.body.lastName;
      if (req.body.email !== undefined) updates.email = req.body.email;
      if (req.body.role !== undefined) updates.role = req.body.role;
      if (updates.email) {
        var duplicate = await User.findOne({ email: updates.email, _id: { $ne: req.params.id } });
        if (duplicate) {
          return res.status(409).json({ success: false, message: "This email is already in use" });
        }
      }

      var updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      }).select("-password");

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      return res.status(200).json({ success: true, message: "User updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

toggleUserStatus: async function (req, res) {
    try {
      var newStatus = req.body.status;
      if (newStatus !== "Active" && newStatus !== "Inactive") {
        return res.status(400).json({ success: false, message: 'status must be "Active" or "Inactive"' });
      }

      var targetUser = await User.findById(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      if (targetUser.email === req.user.email) {
        return res.status(400).json({ success: false, message: "You cannot deactivate your own account" });
      }

      targetUser.status = newStatus;
      await targetUser.save();

      var userObj = targetUser.toObject();
      delete userObj.password;

      return res.status(200).json({
        success: true,
        message: "User status updated to " + newStatus,
        user: userObj,
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
  resetUserPassword: async function (req, res) {
    try {
      var newPassword = req.body.newPassword;
      var generated = false;

      if (!newPassword || newPassword.trim() === "") {
        newPassword = Math.random().toString(36).slice(-8);
        generated = true;
      }

      var user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      user.password = newPassword;
      await user.save();

      return res.status(200).json({
        success: true,
        message: generated
          ? "Password reset. Share this temporary password with the user."
          : "Password reset successfully.",
        temporaryPassword: generated ? newPassword : undefined,
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  deleteUser: async function (req, res) {
    try {
      var user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      if (user.email === req.user.email) {
        return res.status(400).json({ success: false, message: "You cannot delete your own account" });
      }

      await User.findByIdAndDelete(req.params.id);
      return res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
};

module.exports = userManagementController;
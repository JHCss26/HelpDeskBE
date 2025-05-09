const Ticket = require("../models/Ticket");
const crypto = require("crypto");
const { sendEmail } = require("../utils/email.util");
const User = require("../models/User");

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
const getDashboardStats = async (req, res, next) => {
  try {
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: "Open" });
    const resolvedTickets = await Ticket.countDocuments({ status: "Resolved" });
    const slaBreachedTickets = await Ticket.countDocuments({
      isSlaBreached: true,
    });

    res.json({
      totalTickets,
      openTickets,
      resolvedTickets,
      slaBreachedTickets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create User (Admin)
// @route   POST /api/admin/users
// @access  Private (Admin)
const createUserByAdmin = async (req, res, next) => {
  try {
    const { name, email, role, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const tempPassword = crypto.randomBytes(8).toString("hex"); // Temporary random password
    const user = await User.create({
      name,
      email,
      password: tempPassword,
      role,
      phone,
    });

    // Generate Password Reset Token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

    await user.save({ validateBeforeSave: false });

    // Send Email with Password Setup Link
    const resetUrl = `${process.env.FRONTEND_URL}/setup-password/${resetToken}`;

    await sendEmail({
      to: email,
      subject: "🎉 Welcome to HelpDesk! Set Your Password",
      html: `
        <h2>Hello ${name},</h2>
        <p>You have been invited to HelpDesk.</p>
        <p>Please set your password here:</p>
        <a href="${resetUrl}" target="_blank">Set My Password</a>
        <p>This link will expire in 30 minutes.</p>
      `,
    });

    res
      .status(201)
      .json({ message: "User created and password setup email sent" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc Get User by ID
// @route GET /api/admin/users/:id
// @access Private (Admin)
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update User Role
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.json({ message: "User role updated successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete User
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend or Unsuspend User
// @route   PUT /api/admin/users/:id/suspend
// @access  Private/Admin
const suspendUser = async (req, res, next) => {
  try {
    const { suspend } = req.body; // true or false
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.isSuspended = suspend;
    await user.save();

    res.json({
      message: suspend ? "User suspended" : "User unsuspended",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin resets user password (send reset link)
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private/Admin
const resetUserPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "🔐 HelpDesk Password Reset by Admin",
      html: `
        <h2>Hello ${user.name},</h2>
        <p>An administrator has requested a password reset for your account.</p>
        <p>Click below to set your new password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 30 minutes.</p>
      `,
    });

    res.json({ message: "Password reset link sent to user email" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  createUserByAdmin,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  suspendUser,
  resetUserPassword,
};

// app.js
const express = require("express");
const cors = require("cors");
const path = require("path");
// Importing routes
const authRoutes = require("./routes/auth.routes");
const ticketRoutes = require("./routes/ticket.routes");
const testRoutes = require("./routes/test.routes");
const commentRoutes = require("./routes/comment.routes");
const adminRoutes = require("./routes/admin.routes");
const userRoutes = require("./routes/user.routes");
const slaSettingsRoutes = require("./routes/slaSettings.routes");
const categoryRoutes = require("./routes/category.routes");
const departmentRoutes = require("./routes/department.routes");
const notificationRoutes = require("./routes/notification.routes");
const { errorHandler } = require("./middlewares/error.middleware");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Static folder for attachments

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/test", testRoutes);
app.use("/api/admin/sla-settings", slaSettingsRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/notifications", notificationRoutes);

// Error Handling Middleware
app.use(errorHandler);

module.exports = app;

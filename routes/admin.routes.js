const express = require("express");
const {
  getDashboardStats,
  createUserByAdmin,
  getAllUsers,
  updateUserRole,
  deleteUser,
  resetUserPassword,
  suspendUser,
  getUserById,
} = require("../controllers/admin.controller");
const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

const router = express.Router();

// Dashboard stats route (admin only)
router.get("/dashboard", protect, authorizeRoles("admin"), getDashboardStats);

// Admin User Management
router.post("/users", protect, authorizeRoles("admin"), createUserByAdmin);
router.get("/users", protect, authorizeRoles("admin"), getAllUsers);
router.get("/users/:id", protect, authorizeRoles("admin"), getUserById);
router.put("/users/:id", protect, authorizeRoles("admin"), updateUserRole);
router.delete("/users/:id", protect, authorizeRoles("admin"), deleteUser);
router.put("/users/:id/suspend", protect, authorizeRoles("admin"), suspendUser);
router.put(
  "/users/:id/reset-password",
  protect,
  authorizeRoles("admin"),
  resetUserPassword
);
module.exports = router;

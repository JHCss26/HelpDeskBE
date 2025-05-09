const express = require("express");
const { protect } = require("../middlewares/auth.middleware.js");
const {
  getMyNotifications,
  markNotificationRead,
  markAllRead,
} = require("../controllers/notification.controller.js");

const router = express.Router();

router.get("/", protect, getMyNotifications);
router.put("/:id/read", protect, markNotificationRead);
router.put("/mark-all-read", protect, markAllRead);

module.exports = router;

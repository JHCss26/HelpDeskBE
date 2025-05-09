const express = require("express");
const {
  addComment,
  getComments,
  deleteComment,
  editComment,
} = require("../controllers/comment.controller");
const { protect } = require("../middlewares/auth.middleware");
const { upload } = require("../utils/upload.util"); // Reuse same multer upload

const router = express.Router();

// Post comment (with optional attachment)
router.post("/:ticketId", protect, upload.array("file"), addComment);

// Get comments for ticket
router.get("/:ticketId", protect, getComments);

// Delete comment
router.delete("/:commentId", protect, deleteComment);

// Edit comment (allow re-upload new file)
router.put("/:commentId", protect, upload.array("file"), editComment);

module.exports = router;

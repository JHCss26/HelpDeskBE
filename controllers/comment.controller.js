const Comment = require("../models/Comment");
const Ticket = require("../models/Ticket");
const { sendNotification } = require("../sockets/notification.socket");
const { emitCommentUpdate } = require("../sockets/ticket.socket");
const { sendEmail } = require("../utils/email.util");

// Add comment to a ticket
const addComment = async (req, res, next) => {
  const io = req.app.get("io");

  try {
    const { text, parentComment } = req.body;
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const commentData = {
      ticket: ticketId,
      user: req.user._id,
      text,
      parentComment: parentComment || null, // set if it's a reply
    };

    // If file uploaded, attach it
    if (req.files && req.files.length > 0) {
      commentData.attachments = req.files.map((file) => file.path); // Store multiple file paths
    }

    const comment = await Comment.create(commentData);

    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "name email role")
      .populate("parentComment", "user text");

    // Emit real-time socket update
    emitCommentUpdate(ticketId, populatedComment);

    // Send Email Notification to ticket creator or assigned agent
    if (req.user.role === "admin" || req.user.role === "agent") {
      await sendEmail({
        to: ticket.createdBy.email,
        subject: `📝 New Reply on Your Ticket: ${ticket.ticketId}`,
        html: `
        <h2>Hi ${ticket.createdBy.name},</h2>
        <p>There is a new reply on your ticket <strong>${ticket.title}</strong>.</p>
        <p><strong>Message:</strong> ${text}</p>
        <p>Please check your ticket dashboard for more details.</p>
        <br/>
        <p>HelpDesk Support</p>
      `,
      });
      await sendNotification(
        ticket.createdBy._id,
        `New reply from ${ticket.assignedTo.name} on “${ticket.title}” (${ticket.ticketId}).`,
        `/tickets/${ticket._id}`,
        io
      );
    }
    if (req.user.role === "user") {
      await sendEmail({
        to: ticket.assignedTo.email,
        subject: `📝 New reply on Ticket: ${ticket.ticketId}`,
        html: `
        <h2>Hi ${ticket.assignedTo.name},</h2>
        <p>You have new message to the ticket <strong>${ticket.title}</strong>.</p>
        <p><strong>Your Message:</strong> ${text}</p>
        <p>Please Check the ticket dashboard for more details.</p>
        <p>Ticket ID: ${ticket.ticketId}</p>
        <br/>
        <p>HelpDesk Support</p>
      `,
      });

      await sendNotification(
        ticket.assignedTo._id,
        `User ${req.user.name} commented on “${ticket.title}” (${ticket.ticketId}).`,
        `/tickets/${ticket._id}`,
        io
      );
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    next(error);
  }
};

// Get comments for a ticket
const getComments = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const comments = await Comment.find({ ticket: ticketId })
      .populate("user", "name email role")
      .populate({
        path: 'parentComment',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a Comment
// @route   DELETE /api/comments/:commentId
// @access  Private (Comment Owner or Admin)
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user is owner or admin
    if (
      comment.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    await comment.deleteOne();

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit a Comment
// @route   PUT /api/comments/:commentId
// @access  Private (Comment Owner or Admin)
const editComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (
      comment.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this comment" });
    }

    const { text } = req.body;
    if (text) comment.text = text;

    // If new files uploaded, replace existing attachments with new ones
    if (req.files && req.files.length > 0) {
      comment.attachments = req.files.map((file) => file.path); // Replace with new attachments
    }

    await comment.save();

    res.json(comment);
  } catch (error) {
    next(error);
  }
};

module.exports = { addComment, getComments, deleteComment, editComment };

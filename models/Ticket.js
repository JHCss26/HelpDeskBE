// models/Ticket.js
const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Ticket title is required"],
    },
    description: {
      type: String,
      required: [true, "Ticket description is required"],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: [
        "Open",
        "Assigned",
        "In Progress",
        "Pending",
        "Resolved",
        "Closed",
      ],
      default: "Open",
    },
    attachments: [
      {
        type: String, // filename or URL if using S3/Cloudinary later
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    slaDueDate: {
      type: Date,
    },
    isSlaBreached: {
      type: Boolean,
      default: false,
    },
    slaReminderSent: {
      type: Boolean,
      default: false,
    },
    ticketId: {
      type: String,
      unique: true,
    },
    closureReason: {
      type: String,
      enum: [
        "Resolved",
        "Duplicate",
        "Not a Bug",
        "Out of Scope",
        "User Error",
        "Other",
      ],
    },
    resolutionNotes: {
      type: String,
    },
    closureDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;

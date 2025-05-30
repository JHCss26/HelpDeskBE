const Ticket = require("../models/Ticket");
const User = require("../models/User");
const Comment = require("../models/Comment");
const TicketHistory = require("../models/TicketHistory");
const PriorityChangeLog = require("../models/PriorityChangeLog");
const { emitTicketUpdate } = require("../sockets/ticket.socket");
const { calculateSlaDueDate } = require("../utils/sla.utils");
const { sendEmail } = require("../utils/email.util");
const { sendNotification } = require("../sockets/notification.socket");
const ExcelJS = require("exceljs");
const { monthDateRange } = require("../utils/helper");

// @desc    Create new Ticket
// @route   POST /api/tickets
// @access  Private (User)
const createTicket = async (req, res, next) => {
  try {
    const { title, description, category, priority, department } = req.body;
    const io = req.app.get("io");
    const slaDueDate = await calculateSlaDueDate(priority);
    const ticket = await Ticket.create({
      title,
      description,
      department,
      category,
      priority,
      createdBy: req.user._id,
      slaDueDate,
    });

    ticket.ticketId = `#${Math.floor(100000 + Math.random() * 900000)}`;
    // handle attachments if any
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        // store relative path, e.g. /uploads/12345.png
        ticket.attachments.push(`/uploads/${file.filename}`);
      });
    }
    ticket.attachments = ticket.attachments.map((file) =>
      file.replace(/\\/g, "/")
    ); // Normalize path for different OS
    await ticket.save();

    const ticketRecord = await Ticket.findById(ticket._id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("category", "name")
      .populate("department", "name")
      .lean();

    await sendNotification(
      ticket.createdBy._id,
      `You have raised a new ticket: ${ticket.title}`,
      `/tickets/${ticket._id}`,
      io
    );

    await sendEmail({
      to: req.user.email,
      subject: `🎫 Ticket Raised: ${ticketRecord.ticketId}`,
      html: `
        <h2>Hi ${req.user.name},</h2>
        <p>Thank you for contacting HelpDesk Support. Your ticket has been created successfully!</p>
        <h3>Ticket Details:</h3>
        <ul>
          <li><strong>Ticket ID:</strong> ${ticketRecord.ticketId}</li>
          <li><strong>Title:</strong> ${ticketRecord.title}</li>
          <li><strong>Category:</strong> ${ticketRecord.category.name}</li>
          <li><strong>Priority:</strong> ${ticketRecord.priority}</li>
          <li><strong>Status:</strong> ${ticketRecord.status}</li>
        </ul>
        <p>Our support team will review your request and get back to you shortly.</p>
        <p>Thank you,<br/>HelpDesk Team</p>
      `,
    });

    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all Tickets
// @route   GET /api/tickets
// @access  Private (Admin/Agent)
const getAllTickets = async (req, res, next) => {
  try {
    const { status, priority } = req.query;

    // Build a Mongo filter object
    const filter = {};

    if (status) {
      // Allow comma-separated list: ?status=Open,In%20Progress
      const statuses = status.split(",");
      filter.status = { $in: statuses };
    } else {
      // Default to showing all statuses except Closed
      filter.status = { $ne: "Closed" };
    }

    if (priority) {
      const priorities = priority.split(",");
      filter.priority = { $in: priorities };
    }

    const tickets = await Ticket.find(filter)
      .populate("department", "name") // optional if you use department
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

// @desc    Get my Tickets
// @route   GET /api/tickets/my
// @access  Private (User)
const getMyTickets = async (req, res, next) => {
  try {
    const { status, priority } = req.query;

    // Build a Mongo filter object
    const filter = {
      $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }],
    };

    if (status) {
      // Allow comma-separated list: ?status=Open,In%20Progress
      const statuses = status.split(",");
      filter.status = { $in: statuses };
    }

    if (priority) {
      const priorities = priority.split(",");
      filter.priority = { $in: priorities };
    }

    const tickets = await Ticket.find({ createdBy: req.user._id, ...filter })
      .populate("createdBy", "name email")
      .populate("category", "name") // ⬅️ Fetch category name only
      .populate("department", "name") // optional if you use department
      .populate("assignedTo", "name email")
      .sort({
        createdAt: -1,
      });

    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

// @desc    Update Ticket Status or Assign Agent
// @route   PUT /api/tickets/:id
// @access  Private (Agent/Admin)
const updateTicket = async (req, res, next) => {
  const io = req.app.get("io");
  try {
    const { status, assignedTo, priority, closureReason, resolutionNotes } =
      req.body;

    const ticket = await Ticket.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    let isStatusChanged = false;
    let isAssigned = false;
    let isPriorityChanged = false;

    // ── Handle closure fields ──
    if (status === "Closed") {
      if (!closureReason) {
        return res.status(400).json({
          message: "closureReason is required when closing a ticket.",
        });
      }
      ticket.closureReason = closureReason;
      ticket.resolutionNotes = resolutionNotes || "";
      const now = new Date();
      ticket.closureDate = now;
      ticket.totalTimeSpent = now - ticket.createdAt; // Calculate total time spent
    } else {
      ticket.closureReason = undefined;
      ticket.resolutionNotes = undefined;
      ticket.closureDate = undefined;
    }

    if (status === "Reopen") {
      ticket.reOpenDate = new Date();
      ticket.totalTimeSpent = undefined; // Reset time spent when reopening
    }

    // ── Status change & history ──
    if (status && ticket.status !== status) {
      await TicketHistory.create({
        ticket: ticket._id,
        changedBy: req.user._id,
        fieldChanged: "status",
        oldValue: ticket.status,
        newValue: status,
      });
      ticket.status = status;
      ticket.statusHistory.push({
        status,
        at: new Date(),
      });
      isStatusChanged = true;

      // If we just closed it, also log closureReason & notes
      if (status === "Closed") {
        await TicketHistory.create({
          ticket: ticket._id,
          changedBy: req.user._id,
          fieldChanged: "closureReason",
          oldValue: ticket.closureReason,
          newValue: closureReason,
        });
        if (resolutionNotes) {
          await TicketHistory.create({
            ticket: ticket._id,
            changedBy: req.user._id,
            fieldChanged: "resolutionNotes",
            oldValue: ticket.resolutionNotes,
            newValue: resolutionNotes,
          });
        }
      }
    }

    // ── Assignment change & history ──
    if (
      assignedTo &&
      (!ticket.assignedTo || ticket.assignedTo._id.toString() !== assignedTo)
    ) {
      console.log("Assigning to:", assignedTo);
      if (!assignedTo) {
        return res.status(400).json({ message: "assignedTo is required." });
      }
      const newAssignedTo = await User.findById(assignedTo);
      console.log("New assignedTo:", newAssignedTo.name);
      await TicketHistory.create({
        ticket: ticket._id,
        changedBy: req.user._id,
        fieldChanged: "assignedTo",
        oldValue: ticket.assignedTo ? ticket.assignedTo.name : "Unassigned",
        newValue: newAssignedTo?.name, // will be populated by client if needed
      });
      ticket.assignedTo = assignedTo;
      isAssigned = true;
    }

    // ── Priority change & history ──
    if (priority && ticket.priority !== priority) {
      await PriorityChangeLog.create({
        ticket: ticket._id,
        changedBy: req.user._id,
        oldPriority: ticket.priority,
        newPriority: priority,
      });
      await TicketHistory.create({
        ticket: ticket._id,
        changedBy: req.user._id,
        fieldChanged: "priority",
        oldValue: ticket.priority,
        newValue: priority,
      });
      ticket.priority = priority;
      isPriorityChanged = true;
    }

    await ticket.save();

    // ── Real-time update ──
    emitTicketUpdate(ticket._id.toString(), ticket);

    // ── Notifications & Emails ──
    const jobs = [];

    // a) Status-change email/notification
    if (isStatusChanged) {
      if (status === "Closed") {
        jobs.push(
          // Email to user
          sendEmail({
            to: ticket.createdBy.email,
            subject: `✅ Ticket Closed: ${ticket.ticketId}`,
            html: `
              <h2>Hi ${ticket.createdBy.name},</h2>
              <p>Your ticket <strong>${
                ticket.title
              }</strong> has been <strong>closed</strong>.</p>
              <p><strong>Reason:</strong> ${closureReason}</p>
              ${
                resolutionNotes
                  ? `<p><strong>Notes:</strong> ${resolutionNotes}</p>`
                  : ""
              }
              <br/>
              <p>Thank you for using our HelpDesk!</p>
            `,
          }),
          // In-app
          sendNotification(
            ticket.createdBy._id,
            `Your ticket "${ticket.title}" was closed. Reason: ${closureReason}`,
            `/tickets/${ticket._id}`,
            io
          )
        );
      } else {
        jobs.push(
          // Generic status-update email
          sendEmail({
            to: ticket.createdBy.email,
            subject: `🔔 Ticket Update: ${ticket.ticketId}`,
            html: `
              <h2>Hi ${ticket.createdBy.name},</h2>
              <p>Your ticket <strong>${ticket.title}</strong> status is now: <strong>${status}</strong>.</p>
              <br/>
              <p>HelpDesk Team</p>
            `,
          }),
          sendNotification(
            ticket.createdBy._id,
            `Your ticket "${ticket.title}" status changed to ${status}`,
            `/tickets/${ticket._id}`,
            io
          )
        );
      }
    }

    // b) Assignment email/notification
    if (isAssigned) {
      const agent = await User.findById(assignedTo);
      jobs.push(
        sendEmail({
          to: agent.email,
          subject: `🎫 New Ticket Assigned: ${ticket.ticketId}`,
          html: `
            <h2>Hi ${agent.name},</h2>
            <p>A new ticket has been assigned to you:</p>
            <ul>
              <li><strong>ID:</strong> ${ticket.ticketId}</li>
              <li><strong>Title:</strong> ${ticket.title}</li>
              <li><strong>Priority:</strong> ${ticket.priority}</li>
            </ul>
            <p>Please take a look.</p>
          `,
        }),
        sendNotification(
          agent._id,
          `New ticket assigned: ${ticket.ticketId} – "${ticket.title}"`,
          `/tickets/${ticket._id}`,
          io
        ),
        // also inform the original user that an agent picked it up
        sendEmail({
          to: ticket.createdBy.email,
          subject: `🛠 Your Ticket is Now Assigned: ${ticket.ticketId}`,
          html: `
            <h2>Hi ${ticket.createdBy.name},</h2>
            <p>Your ticket <strong>${ticket.title}</strong> was assigned to <strong>${agent.name}</strong> (${agent.email}).</p>
            <p>They will reach out if necessary.</p>
            <br/>
            <p>HelpDesk Team</p>
          `,
        })
      );
    }

    // run all email/notification jobs in parallel
    await Promise.all(jobs);

    return res.json(ticket);
  } catch (error) {
    next(error);
  }
};

// @desc    Upload Attachment
// @route   POST /api/tickets/:id/upload
// @access  Private (User/Agent/Admin)
const uploadAttachment = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    ticket.attachments.push(req.file.path);
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

// @desc    Get ticket + history + comments in one shot
// @route   GET /api/tickets/:id/details
// @access  Private
const getTicketDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("category", "name")
      .lean();

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const history = await TicketHistory.find({ ticket: id })
      .populate("changedBy", "name email")
      .sort({ changedAt: 1 })
      .lean();

    const comments = await Comment.find({ ticket: id })
      .populate("user", "name")
      .populate({
        path: "parentComment",
        populate: { path: "user", select: "name email" },
      })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ ticket, history, comments });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a Ticket (Admin Only)
// @route   DELETE /api/tickets/:id
// @access  Private (Admin)
const deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    await ticket.deleteOne(); // Remove ticket

    res.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Priority Change Logs for a Ticket
// @route   GET /api/tickets/:ticketId/priority-logs
// @access  Private (User/Agent/Admin)
const getPriorityChangeLogs = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const logs = await PriorityChangeLog.find({ ticket: ticketId })
      .populate("changedBy", "name email")
      .sort({ changedAt: 1 });

    res.json(logs);
  } catch (error) {
    next(error);
  }
};

// @desc    Get my assigned Tickets (Agent)
// @route   GET /api/tickets/assigned
// @access  Private (Agent)
const getMyAssignedTickets = async (req, res, next) => {
  try {
    const { status, priority } = req.query;

    // Build a Mongo filter object
    const filter = {
      $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }],
    };

    if (status) {
      // Allow comma-separated list: ?status=Open,In%20Progress
      const statuses = status.split(",");
      filter.status = { $in: statuses };
    }

    if (priority) {
      const priorities = priority.split(",");
      filter.priority = { $in: priorities };
    }

    const tickets = await Ticket.find({ ...filter })
      .populate("createdBy", "name email")
      .populate("category", "name") // ⬅️ Fetch category name only
      .populate("department", "name") // optional if you use department
      .sort({
        createdAt: -1,
      });

    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Ticket History (Audit Trail)
// @route   GET /api/tickets/:ticketId/history
// @access  Private (User/Agent/Admin)
const getTicketHistory = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const history = await TicketHistory.find({ ticket: ticketId })
      .populate("changedBy", "name email")
      .sort({ changedAt: 1 });

    res.json(history);
  } catch (error) {
    next(error);
  }
};

// @desc    Get ticket counts by status for current user
// @route   GET /api/tickets/stats
// @access  Private
const getMyTicketStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Define all possible statuses
    const STATUSES = [
      "Open",
      "In Progress",
      "On Hold",
      "Waiting for Customer",
      "Resolved",
      "Closed",
    ];

    // Aggregate counts grouped by status
    const raw = await Ticket.aggregate([
      {
        $match: { createdBy: userId },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Initialize result with zeros
    const stats = STATUSES.reduce((acc, s) => {
      acc[s] = 0;
      return acc;
    }, {});

    // Fill in actual counts
    raw.forEach((item) => {
      if (stats.hasOwnProperty(item._id)) {
        stats[item._id] = item.count;
      }
    });

    res.json(stats);
  } catch (error) {
    next(error);
  }
};

// @desc    Get ticket counts by status for tickets assigned to current user
// @route   GET /api/tickets/stats/assigned
// @access  Private (Agent/Admin)
const getMyAssignedTicketStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const STATUSES = [
      "Open",
      "In Progress",
      "On Hold",
      "Waiting for Customer",
      "Resolved",
      "Closed",
    ];

    // aggregate on assignedTo
    const raw = await Ticket.aggregate([
      {
        $match: { $or: [{ assignedTo: userId }, { createdBy: userId }] },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // fill in zeros
    const stats = STATUSES.reduce((acc, s) => {
      acc[s] = 0;
      return acc;
    }, {});

    raw.forEach((item) => {
      if (stats.hasOwnProperty(item._id)) {
        stats[item._id] = item.count;
      }
    });

    res.json(stats);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all non-Closed tickets for current user
// @route   GET /api/tickets/my/active
// @access  Private (User)
const getMyActiveTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({
      createdBy: req.user._id,
      status: { $ne: "Closed" },
    })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

// @desc Export tickets to Excel
// @route GET /api/tickets/export
// @access Private (Admin/Agent/User as appropriate)
const exportTickets = async (req, res, next) => {
  try {
    // Fetch tickets based on role
    let query = {};
    if (req.user.role === "user") {
      query = { createdBy: req.user._id };
    } else if (req.user.role === "agent") {
      // agents see all or assigned? adjust if needed:
      query = { assignedTo: req.user._id };
    }
    const tickets = await Ticket.find(query)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("category", "name")
      .populate("department", "name")
      .sort({ createdAt: -1 });

    // Create workbook & sheet
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Tickets");

    // Define columns
    ws.columns = [
      { header: "Ticket ID", key: "ticketId", width: 15 },
      { header: "Title", key: "title", width: 30 },
      { header: "Status", key: "status", width: 15 },
      { header: "Priority", key: "priority", width: 12 },
      { header: "Category", key: "category", width: 20 },
      { header: "Department", key: "department", width: 20 },
      { header: "Created By", key: "createdBy", width: 25 },
      { header: "Assigned To", key: "assignedTo", width: 25 },
      { header: "Created At", key: "createdAt", width: 20 },
      { header: "Updated At", key: "updatedAt", width: 20 },
      { header: "SLA Due Date", key: "slaDueDate", width: 20 },
      { header: "SLA Breached?", key: "isSlaBreached", width: 12 },
    ];

    // Add rows
    tickets.forEach((t) => {
      ws.addRow({
        ticketId: t.ticketId,
        title: t.title,
        status: t.status,
        priority: t.priority,
        category: t.category?.name || "",
        department: t.department?.name || "",
        createdBy: `${t.createdBy.name} <${t.createdBy.email}>`,
        assignedTo: t.assignedTo
          ? `${t.assignedTo.name} <${t.assignedTo.email}>`
          : "",
        createdAt: t.createdAt.toLocaleString(),
        updatedAt: t.updatedAt.toLocaleString(),
        slaDueDate: t.slaDueDate ? t.slaDueDate.toLocaleString() : "",
        isSlaBreached: t.isSlaBreached ? "Yes" : "No",
      });
    });

    // Format header row
    ws.getRow(1).font = { bold: true };

    // Send workbook
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="tickets.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

// @desc Export a single ticket by ID to Excel
// @route GET /api/tickets/:id/export
// @access Private (Admin/Agent/User as appropriate)
const exportTicketById = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("category", "name")
      .populate("department", "name");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Create workbook & sheets
    const wb = new ExcelJS.Workbook();

    // ─── Sheet 1: Ticket Details ───
    const ws1 = wb.addWorksheet("Ticket Details");
    ws1.columns = [
      { header: "Field", key: "field", width: 20 },
      { header: "Value", key: "value", width: 50 },
    ];

    const rows = [
      ["Ticket ID", ticket.ticketId],
      ["Title", ticket.title],
      ["Status", ticket.status],
      ["Priority", ticket.priority],
      ["Category", ticket.category?.name || ""],
      ["Department", ticket.department?.name || ""],
      ["Created By", `${ticket.createdBy.name} <${ticket.createdBy.email}>`],
      [
        "Assigned To",
        ticket.assignedTo
          ? `${ticket.assignedTo.name} <${ticket.assignedTo.email}>`
          : "Unassigned",
      ],
      ["Created At", ticket.createdAt.toLocaleString()],
      ["Updated At", ticket.updatedAt.toLocaleString()],
      [
        "SLA Due Date",
        ticket.slaDueDate ? ticket.slaDueDate.toLocaleString() : "",
      ],
      ["SLA Breached?", ticket.isSlaBreached ? "Yes" : "No"],
      ["Description", ticket.description],
      ["Closure Reason", ticket.closureReason || ""],
      ["Resolution Notes", ticket.resolutionNotes || ""],
      [
        "Closure Date",
        ticket.closureDate ? ticket.closureDate.toLocaleString() : "",
      ],
    ];
    rows.forEach(([field, value]) => ws1.addRow({ field, value }));
    ws1.getRow(1).font = { bold: true };

    // ─── Sheet 2: History ───
    const history = await TicketHistory.find({ ticket: ticket._id })
      .populate("changedBy", "name")
      .sort({ changedAt: 1 });

    const ws2 = wb.addWorksheet("Ticket History");
    ws2.columns = [
      { header: "When", key: "when", width: 20 },
      { header: "Changed By", key: "by", width: 25 },
      { header: "Field Changed", key: "fieldChanged", width: 20 },
      { header: "Old Value", key: "oldValue", width: 25 },
      { header: "New Value", key: "newValue", width: 25 },
    ];
    history.forEach((h) => {
      ws2.addRow({
        when: h.changedAt.toLocaleString(),
        by: h.changedBy.name,
        fieldChanged: h.fieldChanged,
        oldValue: h.oldValue,
        newValue: h.newValue,
      });
    });
    ws2.getRow(1).font = { bold: true };

    // ─── Send file ───
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${ticket.ticketId}.xlsx"`
    );
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

const ticketSummaryChart = async (req, res, next) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;

    if (month < 1 || month > 12) {
      return res.status(400).json({ error: "month must be 1–12" });
    }

    const { start, end } = monthDateRange(year, month);

    const [result] = await Ticket.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      {
        $facet: {

          // status counts
          status: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],

          // 1) Priority counts
          priority: [{ $group: { _id: "$priority", count: { $sum: 1 } } }],

          // 2) By assignee
          assignees: [
            { $group: { _id: "$assignedTo", count: { $sum: 1 } } },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user",
              },
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 0,
                assigneeId: "$_id",
                assigneeName: { $ifNull: ["$user.name", "Unassigned"] },
                count: 1,
              },
            },
            { $sort: { count: -1 } },
          ],

          // 3) By category
          categories: [
            { $group: { _id: "$category", count: { $sum: 1 } } },
            {
              $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "_id",
                as: "cat",
              },
            },
            { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 0,
                categoryId: "$_id",
                categoryName: { $ifNull: ["$cat.name", "Uncategorized"] },
                count: 1,
              },
            },
            { $sort: { count: -1 } },
          ],

          // 4) By department
          departments: [
            { $group: { _id: "$department", count: { $sum: 1 } } },
            {
              $lookup: {
                from: "departments",
                localField: "_id",
                foreignField: "_id",
                as: "dept",
              },
            },
            { $unwind: { path: "$dept", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 0,
                departmentId: "$_id",
                departmentName: { $ifNull: ["$dept.name", "No Department"] },
                count: 1,
              },
            },
            { $sort: { count: -1 } },
          ],
        },
      },
    ]);

    // Turn priority array into an object with zeros for missing enums
    const priorities = ["Low", "Medium", "High", "Critical"];
    const priorityCounts = priorities.reduce((o, p) => {
      o[p] = 0;
      return o;
    }, {});
    result.priority.forEach(({ _id, count }) => {
      priorityCounts[_id] = count;
    });

    const statuses = ["Open", "In Progress", "On Hold", "Waiting for Customer", "Resolved", "Closed"];
    const statusCounts = statuses.reduce((o, s) => {
      o[s] = 0;
      return o;
    }, {});
    result.status.forEach(({ _id, count }) => {
      statusCounts[_id] = count;
    });

    res.json({
      year,
      month,
      status: statusCounts,
      priority: priorityCounts,
      assignees: result.assignees,
      categories: result.categories,
      departments: result.departments,
    });
  } catch (err) {
    console.error("fetch summary error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const totalticketStatusCount = async (req, res, next) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    if (month < 1 || month > 12) {
      return res.status(400).json({ error: "month must be 1–12" });
    }

    const { start, end } = monthDateRange(year, month);

    const aggregation = await Ticket.aggregate([
      // filter to this month
      { $match: { createdAt: { $gte: start, $lt: end } } },

      // group by status
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Turn array into lookup object
    const byStatus = aggregation.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});

    // Compute total as sum of all statuses
    const total = aggregation.reduce((sum, { count }) => sum + count, 0);

    res.json({ year, month, total, byStatus });
  } catch (err) {
    console.error("Error fetching status summary:", err);
    res.status(500).json({ error: "Server error" });
    next(err);
  }
};

module.exports = {
  createTicket,
  getAllTickets,
  getMyTickets,
  updateTicket,
  uploadAttachment,
  getTicketDetails,
  deleteTicket,
  getPriorityChangeLogs,
  getMyAssignedTickets,
  getTicketHistory,
  getMyTicketStats,
  getMyAssignedTicketStats,
  getMyActiveTickets,
  exportTickets,
  exportTicketById,
  ticketSummaryChart,
  totalticketStatusCount,
};

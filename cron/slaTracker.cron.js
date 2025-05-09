const cron = require("node-cron");
const Ticket = require("../models/Ticket");
const User = require("../models/User"); // Added to fetch escalation admin
const { sendEmail } = require("../utils/email.util");
const { sendNotification } = require("../sockets/notification.socket"); // If you want realtime
const TicketHistory = require("../models/TicketHistory");
require("dotenv").config(); // Load environment variables
// You also need global.ioInstance setup in server.js if you use realtime notifications.

const slaTrackerJob = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("🔍 SLA Tracker running...");

    try {
      const now = new Date();

      // Find breached tickets
      const tickets = await Ticket.find({
        slaDueDate: { $lt: now },
        status: { $nin: ["Resolved", "Closed"] },
        isSlaBreached: false,
      }).populate("createdBy assignedTo", "name email");

      for (const ticket of tickets) {
        ticket.isSlaBreached = true;

        // ➡️ Auto Escalation if ticket is stuck
        if (
          !ticket.assignedTo ||
          ticket.status === "Open" ||
          ticket.status === "In Progress"
        ) {
          console.log(`⚡ Auto-Escalating Ticket: ${ticket.ticketId}`);

          // Find first Admin User
          const escalationAdmin = await User.findOne({ role: "admin" });
          console.log("Escalation Admin:", escalationAdmin);
          if (escalationAdmin) {
            const previousAssigned = ticket.assignedTo
              ? ticket.assignedTo.name
              : "Unassigned";

            ticket.assignedTo = escalationAdmin._id;

            await TicketHistory.create({
              ticket: ticket._id,
              changedBy: escalationAdmin._id, // Admin escalator
              fieldChanged: "assignedTo",
              oldValue: previousAssigned,
              newValue: escalationAdmin.name,
            });

            // (Optional) Bump Priority to Critical
            if (ticket.priority !== "Critical") {
              const oldPriority = ticket.priority;
              ticket.priority = "Critical";

              await TicketHistory.create({
                ticket: ticket._id,
                changedBy: escalationAdmin._id,
                fieldChanged: "priority",
                oldValue: oldPriority,
                newValue: "Critical",
              });
            }

            // Send Email to Escalation Admin
            await sendEmail({
              to: escalationAdmin.email,
              subject: `🚨 SLA Breach Escalation: ${ticket.ticketId}`,
              html: `
                <h2>Escalated Ticket Alert</h2>
                <p>Ticket <strong>${ticket.title}</strong> (${ticket.ticketId}) has breached SLA and is now assigned to you.</p>
                <p>Please review immediately.</p>
              `,
            });

            // Send Real-Time Notification (optional if Socket.IO used)
            const io = global.ioInstance;
            if (io) {
              await sendNotification(
                escalationAdmin._id,
                `🚨 SLA breached: Ticket "${ticket.title}" assigned to you.`,
                `/tickets/${ticket._id}`,
                io
              );
            }
          }
        }

        await ticket.save();

        // Send Email Alert to Assigned Agent/Admin
        const recipients = [];

        if (ticket.assignedTo) {
          recipients.push(ticket.assignedTo.email);
        }

        recipients.push("process.env.ADMIN_EMAIL"); // Static fallback admin email

        for (const recipient of recipients) {
          await sendEmail({
            to: recipient,
            subject: `⚠️ SLA Breach: ${ticket.ticketId}`,
            html: `
              <h2>Urgent: SLA Breach Alert!</h2>
              <p>Ticket <strong>${ticket.title}</strong> (${ticket.ticketId}) has breached its SLA deadline.</p>
              <p>Please review and take immediate action.</p>
              <ul>
                <li><strong>Priority:</strong> ${ticket.priority}</li>
                <li><strong>Status:</strong> ${ticket.status}</li>
                <li><strong>Created By:</strong> ${ticket.createdBy.name} (${ticket.createdBy.email})</li>
              </ul>
              <br/>
              <p>HelpDesk System</p>
            `,
          });
        }

        if (io) {
          await sendNotification(
            ticket.createdBy._id,
            `⚠️ SLA Breach: ${ticket.ticketId}`,
            `/tickets/${ticket._id}`,
            io
          );
        }

        console.log(`⚠️ SLA breached for Ticket: ${ticket.ticketId}`);
      }

      // SLA Reminder (tickets about to breach soon)
      const upcomingTickets = await Ticket.find({
        slaDueDate: {
          $gte: now,
          $lte: new Date(now.getTime() + 30 * 60 * 1000), // Next 30 minutes
        },
        status: { $nin: ["Resolved", "Closed"] },
        slaReminderSent: false,
      }).populate("createdBy assignedTo", "name email");

      for (const ticket of upcomingTickets) {
        ticket.slaReminderSent = true; // mark reminder sent
        await ticket.save();

        const recipients = [];

        if (ticket.assignedTo) {
          recipients.push(ticket.assignedTo.email);
        }

        recipients.push("process.env.ADMIN_EMAIL");

        for (const recipient of recipients) {
          await sendEmail({
            to: recipient,
            subject: `⏰ SLA Reminder: ${ticket.ticketId}`,
            html: `
              <h2>Upcoming SLA Deadline</h2>
              <p>Ticket <strong>${ticket.title}</strong> (${ticket.ticketId}) is approaching its SLA deadline within 30 minutes.</p>
              <p>Please prioritize this ticket urgently.</p>
            `,
          });
        }

        // in-app notification
        if (io) {
          await sendNotification(
            ticket.assignedTo?._id || ticket.createdBy._id,
            `⏰ SLA Reminder: ${ticket.ticketId} due soon`,
            `/tickets/${ticket._id}`,
            io
          );
        }
        console.log(`⏰ SLA reminder sent for Ticket: ${ticket.ticketId}`);
      }

      if (tickets.length === 0) {
        console.log("✅ No SLA breaches found this hour.");
      }
    } catch (error) {
      console.error("❌ SLA Cron Error:", error);
    }
  });
};

module.exports = { slaTrackerJob };

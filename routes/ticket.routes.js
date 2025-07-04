// routes/ticket.routes.js
const express = require("express");
const {
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
  averageOpenTime,
  bargraphForTicketStatus,
} = require("../controllers/ticket.controller");
const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { upload } = require("../utils/upload.util");
const router = express.Router();

// Create a new ticket (User)
router.post("/", protect, authorizeRoles("user", "admin", "agent"), upload.array('attachments', 5), createTicket);

// Get all tickets (Admin / Agent)
router.get("/", protect, authorizeRoles("admin", "agent"), getAllTickets);

// Get my own tickets (User)
router.get("/my", protect, authorizeRoles("user"), getMyTickets);

// Update ticket (assign or status change) (Admin / Agent)
router.put("/:id", protect, authorizeRoles("admin", "agent"), updateTicket);

// Upload attachment and link to ticket
router.post(
  "/:id/upload",
  protect,
  authorizeRoles("user", "agent", "admin"),
  upload.single("file"),
  uploadAttachment
);

// Get ticket details with comments (User / Agent / Admin)
router.get("/:id/details", protect, getTicketDetails);

// Delete a ticket (Admin only)
router.delete("/:id", protect, authorizeRoles("admin"), deleteTicket);

// Get Priority Change Logs
router.get("/:ticketId/priority-logs", protect, getPriorityChangeLogs);

// Get my assigned tickets (Agent)
router.get(
  "/assigned",
  protect,
  authorizeRoles("agent", "admin"),
  getMyAssignedTickets
);

// Get ticket history (User / Agent / Admin)
router.get("/:ticketId/history", protect, getTicketHistory);

// Get ticket stats (User / Agent / Admin)
router.get("/stats", protect, getMyTicketStats);

//Get assigned tickets stats (Agent)
router.get("/assigned/stats", protect, getMyAssignedTicketStats);

// Get active tickets (User / Agent / Admin)
router.get("/my/active", protect, getMyActiveTickets);

// Export tickets (Admin / Agent / User)
router.get('/export', protect, exportTickets);

// Export ticket by id (Admin / Agent / User)
router.get('/:id/export', protect, exportTicketById)

// Get Summary of all ticket using donut chart
router.get("/summary", protect, ticketSummaryChart);

// get total numbers of tickets by status
router.get("/status/totals", protect, totalticketStatusCount);

// Api for geting Open Vs Close of Each month
router.get("/status/bargraph", protect, bargraphForTicketStatus)

module.exports = router;

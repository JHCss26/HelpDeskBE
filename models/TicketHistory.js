const mongoose = require('mongoose');

const ticketHistorySchema = new mongoose.Schema({
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  fieldChanged: { type: String },
  oldValue: { type: String },
  newValue: { type: String },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changedAt: { type: Date, default: Date.now },
});

const TicketHistory = mongoose.model('TicketHistory', ticketHistorySchema);

module.exports = TicketHistory;

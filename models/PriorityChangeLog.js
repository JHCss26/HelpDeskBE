const mongoose = require('mongoose');

const priorityChangeLogSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  oldPriority: {
    type: String,
    required: true,
  },
  newPriority: {
    type: String,
    required: true,
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
});

const PriorityChangeLog = mongoose.model('PriorityChangeLog', priorityChangeLogSchema);

module.exports = PriorityChangeLog;

const mongoose = require('mongoose');

const slaSettingsSchema = new mongoose.Schema({
  critical: { type: Number, default: 4 }, // hours
  high: { type: Number, default: 8 },
  medium: { type: Number, default: 24 },
  low: { type: Number, default: 48 },
});

const SLASettings = mongoose.model('SLASettings', slaSettingsSchema);

module.exports = SLASettings;

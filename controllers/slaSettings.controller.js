const SLASettings = require('../models/SLASettings');

// @desc    Get SLA Settings
// @route   GET /api/admin/sla-settings
// @access  Private (Admin)
const getSLASettings = async (req, res, next) => {
  try {
    let settings = await SLASettings.findOne();
    if (!settings) {
      // If no settings exist, create default
      settings = await SLASettings.create({});
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

// @desc    Update SLA Settings
// @route   PUT /api/admin/sla-settings
// @access  Private (Admin)
const updateSLASettings = async (req, res, next) => {
  try {
    let settings = await SLASettings.findOne();
    if (!settings) {
      settings = await SLASettings.create({});
    }

    const { critical, high, medium, low } = req.body;

    if (critical) settings.critical = critical;
    if (high) settings.high = high;
    if (medium) settings.medium = medium;
    if (low) settings.low = low;

    await settings.save();

    res.json({ message: 'SLA settings updated successfully', settings });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSLASettings, updateSLASettings };

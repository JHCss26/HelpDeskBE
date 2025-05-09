const SLASettings = require("../models/SLASettings");

// Function to calculate SLA due date based on live settings
const calculateSlaDueDate = async (priority) => {
  const now = new Date();
  let settings = await SLASettings.findOne();

  if (!settings) {
    settings = await SLASettings.create({});
  }

  let hoursToAdd = 24; // default fallback

  switch (priority) {
    case "Critical":
      hoursToAdd = settings.critical;
      break;
    case "High":
      hoursToAdd = settings.high;
      break;
    case "Medium":
      hoursToAdd = settings.medium;
      break;
    case "Low":
      hoursToAdd = settings.low;
      break;
    default:
      hoursToAdd = 24;
  }

  return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
};

module.exports = {
  calculateSlaDueDate,
};
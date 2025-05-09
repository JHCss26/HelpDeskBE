const express = require('express');
const { getSLASettings, updateSLASettings } = require('../controllers/slaSettings.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

const router = express.Router();

// Admin routes for SLA
router.get('/', protect, authorizeRoles('admin'), getSLASettings);
router.put('/', protect, authorizeRoles('admin'), updateSLASettings);

module.exports = router;

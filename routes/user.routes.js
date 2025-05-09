const { getMyProfile, updateMyProfile, changePassword, forgotPassword, resetPassword, getAllUsers } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { upload } = require('../utils/upload.util'); // for avatar upload

const express = require('express');
const router = express.Router();

// Get my profile
router.get('/profile', protect, getMyProfile);

// Update my profile (with optional avatar upload)
router.put('/profile', protect, upload.single('avatar'), updateMyProfile);

// Change password
router.put('/password', protect, changePassword);

// Forgot password
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password/:token', resetPassword);

router.get('/', protect, getAllUsers)

// Export the router
module.exports = router;

// routes/test.routes.js
const express = require('express');
const { sendEmail } = require('../utils/email.util');
const router = express.Router();

// Temporary Test Email Route
router.get('/email', async (req, res) => {
  try {
    await sendEmail({
      to: 'zeeshanc@helerfoods.com', // your email here
      subject: 'HelpDesk Test Email',
      text: 'If you are seeing this, email service is working fine! 🎯',
    });

    res.json({ message: '✅ Test email sent successfully!' });
  } catch (error) {
    console.error('Email Test Error:', error);
    res.status(500).json({ message: '❌ Email test failed.', error: error.message });
  }
});

module.exports = router;

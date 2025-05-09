// utils/email.util.js
const transporter = require('../config/email');
require('dotenv').config();

const sendEmail = async ({ to, subject, text, html }) => {
  const mailOptions = {
    from: `"HelpDesk System" <${process.env.EMAIL_USER}>`, // sender address
    to,
    subject,
    text,
    html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };

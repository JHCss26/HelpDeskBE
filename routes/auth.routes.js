// routes/auth.routes.js
const express = require('express');
const { register, login } = require('../controllers/auth.controller');

const router = express.Router();

// @route POST /api/auth/register
router.post('/register', register);

// @route POST /api/auth/login
router.post('/login', login);

module.exports = router;

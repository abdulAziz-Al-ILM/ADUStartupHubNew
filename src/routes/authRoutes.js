const express = require('express');
const router = express.Router();
const { requestOtp, verifyOtp } = require('../controllers/authController');

// POST /api/auth/request-otp -> Pochta kiritilganda kod so'rash
router.post('/request-otp', requestOtp);

// POST /api/auth/verify-otp -> 4 xonali kodni tasdiqlash
router.post('/verify-otp', verifyOtp);

module.exports = router;

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Profilni yuklash
router.get('/me', verifyToken, userController.getProfile);

// Profilni (Rezyumeni) tahrirlash
router.put('/profile', verifyToken, userController.updateProfile);

module.exports = router;

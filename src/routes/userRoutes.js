const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/me', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);

module.exports = router;

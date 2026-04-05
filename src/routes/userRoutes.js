const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { updateProfile, getProfile } = require('../controllers/userController');

// Barcha amallar himoyalangan
router.use(protect);

router.get('/me', getProfile);          // Profilni ko'rish
router.put('/me', updateProfile);       // Profilni yangilash (Stiker, Mutaxassislik, AI tekshiruv)

module.exports = router;

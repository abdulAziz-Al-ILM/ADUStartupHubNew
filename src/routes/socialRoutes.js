const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getSpecialists, followUser, sendMessage } = require('../controllers/socialController');

router.use(protect);

router.get('/specialists', getSpecialists); // API: /api/social/specialists?search=Ali&profession=IT_ENGINEER
router.post('/follow', followUser);
router.post('/message', sendMessage);

module.exports = router;

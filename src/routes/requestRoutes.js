const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { 
  sendRequest, 
  getIncomingRequests, 
  updateRequestStatus 
} = require('../controllers/requestController');

router.use(protect);

router.post('/', sendRequest);                    // Ariza yuborish
router.get('/inbox', getIncomingRequests);        // Menga kelgan arizalar
router.put('/:id/status', updateRequestStatus);   // Qabul qilish yoki Rad etish

module.exports = router;

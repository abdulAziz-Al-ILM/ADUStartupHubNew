const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getDashboardStats } = require('../controllers/dashboardController');

router.use(protect);

// GET /api/dashboard - Kim murojaat qilganiga qarab turli axborot beradi
router.get('/', getDashboardStats);

module.exports = router;

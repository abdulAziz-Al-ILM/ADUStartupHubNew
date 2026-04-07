const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protect } = require('../middlewares/authMiddleware');

// Barcha loyihalarni ko'rish va qidirish
router.get('/', protect, projectController.getAllProjects);

// Yangi loyiha yaratish
router.post('/', protect, projectController.createProject);

// Loyiha holatini o'zgartirish (AI sabablari bilan)
router.put('/:id/status', protect, projectController.updateProjectStatus);

module.exports = router;

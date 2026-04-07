const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Barcha loyihalarni ko'rish va qidirish
router.get('/', verifyToken, projectController.getAllProjects);

// Yangi loyiha yaratish
router.post('/', verifyToken, projectController.createProject);

// Loyiha holatini o'zgartirish (AI sabablari bilan)
router.put('/:id/status', verifyToken, projectController.updateProjectStatus);

module.exports = router;

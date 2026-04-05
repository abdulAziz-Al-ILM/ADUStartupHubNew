const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { createProject, getAllProjects, updateProjectStatus } = require('../controllers/projectController');

router.use(protect);

router.post('/', createProject);
router.get('/', getAllProjects); // API manzil: /api/projects?search=Nomi&category=IT_ENGINEER&status=MVP_PREPARATION
router.put('/:id/status', updateProjectStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { 
  createProject, 
  getAllProjects, 
  getMyProjects, 
  deleteProject 
} = require('../controllers/projectController');

// Barcha API'lar himoyalangan (Tizimga kirgan bo'lishi shart)
router.use(protect);

router.post('/', createProject);          // Yangi qo'shish
router.get('/', getAllProjects);          // Hammasini ko'rish
router.get('/my', getMyProjects);         // O'zimnikini ko'rish
router.delete('/:id', deleteProject);     // ID bo'yicha o'chirish

module.exports = router;

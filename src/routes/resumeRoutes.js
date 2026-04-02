const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { 
  createResume, 
  getAllResumes, 
  getMyResumes, 
  deleteResume 
} = require('../controllers/resumeController');

router.use(protect);

router.post('/', createResume);
router.get('/', getAllResumes);
router.get('/my', getMyResumes);
router.delete('/:id', deleteResume);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { createProblem, getAllProblems, deleteProblem } = require('../controllers/problemController');

router.use(protect);

router.post('/', createProblem);
router.get('/', getAllProblems);
router.delete('/:id', deleteProblem);

module.exports = router;

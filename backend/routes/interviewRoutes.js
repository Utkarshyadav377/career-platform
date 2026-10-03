const express = require('express');
const c = require('../controllers/interviewController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);
router.post('/start', c.start);
router.get('/', c.list);
router.get('/:id', c.getOne);
router.post('/:id/answer', c.answer);

module.exports = router;

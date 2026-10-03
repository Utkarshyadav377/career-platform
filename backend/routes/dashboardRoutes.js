const express = require('express');
const c = require('../controllers/dashboardController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/', protect, c.summary);

module.exports = router;

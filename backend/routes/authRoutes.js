const express = require('express');
const c = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();
router.post('/register', c.register);
router.post('/login', c.login);
router.post('/forgot-password', c.forgotPassword);
router.post('/reset-password/:token', c.resetPassword);
router.get('/me', protect, c.me);
router.put('/profile', protect, c.updateProfile);
router.put('/password', protect, c.changePassword);

module.exports = router;

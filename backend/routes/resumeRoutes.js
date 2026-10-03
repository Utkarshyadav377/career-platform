const express = require('express');
const c = require('../controllers/resumeController');
const protect = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();
router.use(protect);
router.post('/upload', upload.single('resume'), c.upload);
router.get('/', c.list);
router.get('/:id', c.getOne);
router.delete('/:id', c.remove);

module.exports = router;

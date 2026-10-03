const express = require('express');
const c = require('../controllers/jobController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.post('/match', c.match);
router.get('/matches', c.listMatches);

router.get('/applications', c.listApplications);
router.post('/applications', c.createApplication);
router.put('/applications/:id', c.updateApplication);
router.delete('/applications/:id', c.deleteApplication);

module.exports = router;

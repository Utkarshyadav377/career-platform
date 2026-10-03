const express = require('express');
const protect = require('../middleware/authMiddleware');
const Resume = require('../models/Resume');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Job = require('../models/Job');
const ai = require('../services/aiService');

const router = express.Router();

router.post('/recommendations', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const resume = await Resume.findOne({ userId }).sort({ createdAt: -1 });
    if (!resume) return res.status(400).json({ message: 'Upload a resume first' });

    const [apps, interviews, jobs] = await Promise.all([
      Application.find({ userId }).select('company role status'),
      Interview.find({ userId, status: 'completed' }).select('role score report'),
      Job.find({ userId }).select('role matchScore missingSkills'),
    ]);

    const result = await ai.careerRecommendation({
      resume_text: resume.extractedText.slice(0, 5000),
      profile_skills: req.user.skills || [],
      target_role: req.user.targetRole || '',
      applications: apps.map((a) => ({ company: a.company, role: a.role, status: a.status })),
      interviews: interviews.map((i) => ({
        role: i.role,
        score: i.score,
        needs_improvement: i.report ? i.report.needsImprovement : [],
      })),
      job_matches: jobs.map((j) => ({ role: j.role, score: j.matchScore, missing_skills: j.missingSkills })),
    });
    res.json({ recommendation: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

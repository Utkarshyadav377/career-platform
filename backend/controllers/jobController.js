const Job = require('../models/Job');
const Application = require('../models/Application');
const Resume = require('../models/Resume');
const ai = require('../services/aiService');

// ---- Job description matcher ----
exports.match = async (req, res, next) => {
  try {
    const { description, company, role, resumeId } = req.body;
    if (!description || description.trim().length < 30) {
      return res.status(400).json({ message: 'Please paste a job description (at least a few lines)' });
    }
    const query = { userId: req.user._id };
    if (resumeId) query._id = resumeId;
    const resume = await Resume.findOne(query).sort({ createdAt: -1 });
    if (!resume) return res.status(400).json({ message: 'Upload a resume first' });

    const result = await ai.matchJob(resume.extractedText, description);
    const job = await Job.create({
      userId: req.user._id,
      company,
      role,
      description,
      matchScore: result.overall_score,
      breakdown: result.breakdown,
      matchedSkills: result.matched_skills,
      missingSkills: result.missing_skills,
      recommendedLearning: result.recommended_learning,
    });
    res.status(201).json({ job });
  } catch (err) {
    next(err);
  }
};

exports.listMatches = async (req, res, next) => {
  try {
    const jobs = await Job.find({ userId: req.user._id }).select('-description').sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
};

// ---- Application tracker (CRUD) ----
exports.listApplications = async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    const applications = await Application.find(filter).sort({ updatedAt: -1 });
    res.json({ applications });
  } catch (err) {
    next(err);
  }
};

exports.createApplication = async (req, res, next) => {
  try {
    const { company, role } = req.body;
    if (!company || !role) return res.status(400).json({ message: 'Company and role are required' });
    const application = await Application.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ application });
  } catch (err) {
    next(err);
  }
};

exports.updateApplication = async (req, res, next) => {
  try {
    const { userId, _id, ...fields } = req.body; // never allow changing ownership
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      fields,
      { new: true, runValidators: true }
    );
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json({ application });
  } catch (err) {
    next(err);
  }
};

exports.deleteApplication = async (req, res, next) => {
  try {
    const application = await Application.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

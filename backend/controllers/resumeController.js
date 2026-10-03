const fs = require('fs');
const path = require('path');
const Resume = require('../models/Resume');
const ai = require('../services/aiService');

exports.upload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload a PDF file (field name: resume)' });

    const text = await ai.extractPdfText(req.file.path);
    if (!text || text.trim().length < 50) {
      fs.unlink(req.file.path, () => {});
      return res.status(422).json({ message: 'Could not read enough text from this PDF. Is it a scanned image?' });
    }

    const analysis = await ai.analyzeResume(text, req.user.targetRole);

    const resume = await Resume.create({
      userId: req.user._id,
      fileName: req.file.originalname,
      fileUrl: `/uploads/${path.basename(req.file.path)}`,
      extractedText: text,
      score: analysis.overall_score,
      breakdown: {
        ats: analysis.breakdown.ats,
        technicalSkills: analysis.breakdown.technical_skills,
        experience: analysis.breakdown.experience,
        projects: analysis.breakdown.projects,
        education: analysis.breakdown.education,
        achievements: analysis.breakdown.achievements,
      },
      skills: analysis.skills,
      suggestions: analysis.suggestions,
      summary: analysis.summary,
    });
    res.status(201).json({ resume });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id })
      .select('-extractedText')
      .sort({ createdAt: -1 });
    res.json({ resumes });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id }).select('-extractedText');
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json({ resume });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.fileUrl) fs.unlink(path.join(ai.uploadsDir, path.basename(resume.fileUrl)), () => {});
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileName: String,
    fileUrl: String,
    extractedText: String,
    score: { type: Number, default: 0 },
    breakdown: {
      ats: Number,
      technicalSkills: Number,
      experience: Number,
      projects: Number,
      education: Number,
      achievements: Number,
    },
    skills: [String],
    suggestions: [
      {
        issue: String,
        current: String,
        improved: String,
      },
    ],
    summary: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);

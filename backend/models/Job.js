const mongoose = require('mongoose');

// A saved job description + its match analysis against the user's resume.
const jobSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: String,
    role: String,
    description: { type: String, required: true },
    matchScore: Number,
    breakdown: {
      skills: Number,
      experience: Number,
      education: Number,
      projects: Number,
    },
    matchedSkills: [String],
    missingSkills: [String],
    recommendedLearning: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);

const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: String,
    difficulty: String,
    type: String,
    questions: [String],
    answers: [
      {
        questionIndex: Number,
        answer: String,
        score: Number,
        technicalAccuracy: Number,
        communication: Number,
        completeness: Number,
        strengths: [String],
        improvements: [String],
      },
    ],
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
    score: Number,
    report: {
      technicalKnowledge: Number,
      communication: Number,
      problemSolving: Number,
      confidence: Number,
      strongAreas: [String],
      needsImprovement: [String],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);

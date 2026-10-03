const mongoose = require('mongoose');

// A tracked job application.
const applicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    location: String,
    salary: String,
    applicationDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['Saved', 'Applied', 'Screening', 'Interview', 'Offer', 'Rejected'],
      default: 'Saved',
    },
    jobUrl: String,
    notes: String,
    nextInterview: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', applicationSchema);

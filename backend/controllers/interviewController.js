const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const ai = require('../services/aiService');

const TOTAL_QUESTIONS = 10;

exports.start = async (req, res, next) => {
  try {
    const { role = 'Software Engineer', difficulty = 'Medium', type = 'Technical', numQuestions } = req.body;
    const count = Math.min(Math.max(parseInt(numQuestions, 10) || TOTAL_QUESTIONS, 3), 15);
    const resume = await Resume.findOne({ userId: req.user._id }).sort({ createdAt: -1 });

    const { questions } = await ai.generateInterview({
      role,
      difficulty,
      interview_type: type,
      num_questions: count,
      resume_text: resume ? resume.extractedText.slice(0, 4000) : '',
    });

    const interview = await Interview.create({
      userId: req.user._id,
      role,
      difficulty,
      type,
      questions,
    });
    res.status(201).json({ interview });
  } catch (err) {
    next(err);
  }
};

exports.answer = async (req, res, next) => {
  try {
    const { answer } = req.body;
    if (!answer || !answer.trim()) return res.status(400).json({ message: 'Answer cannot be empty' });

    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    if (interview.status === 'completed') return res.status(400).json({ message: 'Interview already completed' });

    const idx = interview.answers.length;
    if (idx >= interview.questions.length) return res.status(400).json({ message: 'No more questions' });

    const ev = await ai.evaluateAnswer({
      role: interview.role,
      difficulty: interview.difficulty,
      interview_type: interview.type,
      question: interview.questions[idx],
      answer,
    });

    interview.answers.push({
      questionIndex: idx,
      answer,
      score: ev.score,
      technicalAccuracy: ev.technical_accuracy,
      communication: ev.communication,
      completeness: ev.completeness,
      strengths: ev.strengths,
      improvements: ev.improvements,
    });

    const done = interview.answers.length === interview.questions.length;
    if (done) {
      const report = await ai.interviewReport({
        role: interview.role,
        evaluations: interview.answers.map((a, i) => ({
          question: interview.questions[i],
          score: a.score,
          technical_accuracy: a.technicalAccuracy,
          communication: a.communication,
          completeness: a.completeness,
          strengths: a.strengths,
          improvements: a.improvements,
        })),
      });
      interview.status = 'completed';
      interview.score = report.overall_score;
      interview.report = {
        technicalKnowledge: report.technical_knowledge,
        communication: report.communication,
        problemSolving: report.problem_solving,
        confidence: report.confidence,
        strongAreas: report.strong_areas,
        needsImprovement: report.needs_improvement,
      };
    }
    await interview.save();
    res.json({ evaluation: interview.answers[idx], interview, completed: done });
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ userId: req.user._id })
      .select('role difficulty type status score createdAt questions')
      .sort({ createdAt: -1 });
    res.json({ interviews });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    res.json({ interview });
  } catch (err) {
    next(err);
  }
};

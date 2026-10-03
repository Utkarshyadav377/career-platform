// AI layer, running in-process inside the Express app (no separate service).
// Function names and payload/response shapes are unchanged, so controllers need no edits.
const fs = require('fs');
const path = require('path');
const { extractText } = require('./ai/pdfParser');
const resumeAnalyzer = require('./ai/resumeAnalyzer');
const jobMatcher = require('./ai/jobMatcher');
const interviewEngine = require('./ai/interviewEngine');
const career = require('./ai/career');
const { llmAvailable } = require('./ai/llm');

async function extractPdfText(filePath) {
  try {
    return await extractText(fs.readFileSync(filePath));
  } catch (err) {
    const e = new Error('Could not extract text from PDF');
    e.status = 422;
    throw e;
  }
}

module.exports = {
  llmAvailable,
  extractPdfText,
  analyzeResume: (text, targetRole) => resumeAnalyzer.analyze(text, targetRole || ''),
  matchJob: (resumeText, jobDescription) => jobMatcher.match(resumeText, jobDescription),
  generateInterview: async (p) => ({
    questions: await interviewEngine.generate(p.role, p.difficulty, p.interview_type, p.num_questions, p.resume_text || ''),
  }),
  evaluateAnswer: (p) => interviewEngine.evaluate(p.role, p.difficulty, p.interview_type, p.question, p.answer),
  interviewReport: (p) => interviewEngine.report(p.role, p.evaluations),
  careerRecommendation: (p) => career.recommend(p),
  uploadsDir: path.join(__dirname, '..', 'uploads'),
};

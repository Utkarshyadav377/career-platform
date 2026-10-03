// AI interviewer: question generation, answer evaluation, final report.
const { clamp, completeJson } = require('./llm');
const { extractSkills } = require('./skills');

const QUESTION_BANK = {
  data: [
    'Explain the difference between Random Forest and XGBoost.',
    'How do you handle class imbalance in a classification problem?',
    'What is the bias-variance tradeoff, and how does it affect model choice?',
    'Explain precision, recall and F1. When would you optimise for recall?',
    'How would you detect and handle data leakage?',
    'Walk me through how you would evaluate a model before deploying it.',
    'What is regularisation? Compare L1 and L2.',
    'Write a SQL query idea to find the top 3 customers by revenue per month.',
    'How does gradient descent work, and what can go wrong?',
    'How would you monitor a deployed ML model for drift?',
    'Explain cross-validation and when k-fold is a bad idea.',
    'How do you deal with missing values in a dataset?',
  ],
  software: [
    'Explain how a hash map works and its time complexity.',
    'What is the difference between a process and a thread?',
    'How would you design a URL shortener?',
    'Explain REST vs GraphQL and when you would choose each.',
    'What happens when you type a URL into the browser and press Enter?',
    'How do database indexes work, and what are their downsides?',
    'Explain the CAP theorem with an example.',
    'How would you find a cycle in a linked list?',
    'What is the difference between SQL and NoSQL databases?',
    'How do you make an API secure? Cover authentication and common attacks.',
    'Explain how you would design a rate limiter.',
    'Describe how JWT authentication works and its pitfalls.',
  ],
  web: [
    'Explain the virtual DOM and how React decides what to re-render.',
    'What is the difference between useEffect and useMemo?',
    'How does the JavaScript event loop work?',
    'Explain CORS and why browsers enforce it.',
    'How would you optimise the performance of a slow React page?',
    'What is the difference between cookies, localStorage and sessionStorage?',
    'How do you structure state management in a large React app?',
    'Explain how middleware works in Express.',
  ],
  behavioral: [
    'Tell me about a project you are most proud of and your specific contribution.',
    'Describe a time you had to learn a new technology quickly.',
    'Tell me about a time you disagreed with a teammate. What happened?',
    'Describe a bug that took you a long time to fix. How did you approach it?',
    'Why are you moving into software/AI from a different background?',
    'Tell me about a time you missed a deadline or a goal.',
    'How do you prioritise when you have several tasks due at once?',
    'Where do you see yourself in three years?',
  ],
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function bankFor(role, itype) {
  const r = role.toLowerCase();
  const t = itype.toLowerCase();
  if (t.includes('behav') || t.includes('hr')) return QUESTION_BANK.behavioral;
  if (['data', 'ml', 'machine', 'ai ', 'ai-', 'scientist', 'analyst'].some((k) => r.includes(k)) || r.trim() === 'ai engineer') {
    return QUESTION_BANK.data;
  }
  if (['frontend', 'front-end', 'react', 'web', 'full'].some((k) => r.includes(k))) {
    return [...QUESTION_BANK.web, ...QUESTION_BANK.software];
  }
  return QUESTION_BANK.software;
}

async function generate(role, difficulty, itype, n, resumeText) {
  const data = await completeJson(
    'You are a senior interviewer who writes sharp, specific interview questions.',
    `Write ${n} ${difficulty}-difficulty ${itype} interview questions for a ${role} candidate. ` +
      'Order them from easier to harder, keep each to 1-2 sentences, no numbering, no answers.' +
      (resumeText ? ` Tailor some to this resume:\n${resumeText.slice(0, 2500)}` : '') +
      '\nReturn JSON {"questions": ["..."]}.',
    1500
  );
  if (data && Array.isArray(data.questions)) {
    const qs = data.questions.map((q) => String(q).trim()).filter(Boolean);
    if (qs.length >= Math.min(n, 3)) return qs.slice(0, n);
  }

  let pool = [...bankFor(role, itype)];
  if (itype.toLowerCase().includes('mixed')) pool = pool.concat(QUESTION_BANK.behavioral.slice(0, 2));
  const out = shuffle(pool).slice(0, n);
  while (out.length < n) out.push(QUESTION_BANK.software[Math.floor(Math.random() * QUESTION_BANK.software.length)]);
  return out;
}

const round1 = (x) => Math.round(x * 10) / 10;
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

function fallbackEval(question, answer) {
  const words = answer.split(/\s+/).filter(Boolean);
  const n = words.length;
  const qTerms = new Set((question.match(/[A-Za-z][A-Za-z+#.-]{3,}/g) || []).map((w) => w.toLowerCase()));
  const aLow = answer.toLowerCase();
  let overlap = 0;
  qTerms.forEach((t) => { if (aLow.includes(t)) overlap++; });
  const coverage = qTerms.size ? overlap / qTerms.size : 0.5;

  const lengthScore = Math.min(10, n / 12); // ~120 words -> full marks
  const structure = /\b(because|therefore|however|for example|e\.g\.|whereas|while)\b/.test(aLow) ? 1.0 : 0.0;
  const technical = Math.max(1, Math.min(10, 3 + coverage * 4 + lengthScore * 0.3 + structure));
  const communication = Math.max(1, Math.min(10, 3 + lengthScore * 0.5 + structure * 2 + (answer.trim().endsWith('.') ? 1 : 0)));
  const completeness = Math.max(1, Math.min(10, lengthScore * 0.9 + coverage * 2));
  const score = round1(technical * 0.5 + communication * 0.2 + completeness * 0.3);

  const strengths = [];
  const improvements = [];
  if (n >= 60) strengths.push('Gave a reasonably detailed answer.');
  if (structure) strengths.push('Used reasoning words that connect ideas.');
  if (n < 40) improvements.push('Expand the answer: define the concept, compare alternatives, then give an example.');
  if (!structure) improvements.push("Explain the 'why' and the trade-offs, not just the definition.");
  improvements.push('Automatic scoring is approximate. Set ANTHROPIC_API_KEY for a real technical evaluation.');
  return {
    score,
    technical_accuracy: round1(technical),
    communication: round1(communication),
    completeness: round1(completeness),
    strengths: strengths.length ? strengths : ['Attempted the question.'],
    improvements,
  };
}

async function evaluate(role, difficulty, itype, question, answer) {
  const data = await completeJson(
    'You are a strict but fair technical interviewer. Score only what the candidate actually said; ' +
      'do not credit points they did not make. Scores are 0-10 and may use one decimal.',
    `Role: ${role}\nDifficulty: ${difficulty}\nType: ${itype}\n\nQuestion: ${question}\n\nCandidate answer: ${answer.slice(0, 4000)}\n\n` +
      'Return JSON {"score": n, "technical_accuracy": n, "communication": n, "completeness": n, ' +
      '"strengths": ["..."], "improvements": ["..."]}. "strengths" lists things the answer got right; ' +
      '"improvements" lists specific missing or wrong points (max 3 each).',
    800
  );
  if (data) {
    try {
      return {
        score: round1(clamp(data.score, 0, 10)),
        technical_accuracy: round1(clamp(data.technical_accuracy, 0, 10)),
        communication: round1(clamp(data.communication, 0, 10)),
        completeness: round1(clamp(data.completeness, 0, 10)),
        strengths: (data.strengths || []).map(String).slice(0, 4),
        improvements: (data.improvements || []).map(String).slice(0, 4),
      };
    } catch {
      /* fall through */
    }
  }
  return fallbackEval(question, answer);
}

async function report(role, evals) {
  if (!evals.length) {
    return { overall_score: 0, technical_knowledge: 0, communication: 0, problem_solving: 0, confidence: 0, strong_areas: [], needs_improvement: [] };
  }
  const tech = mean(evals.map((e) => e.technical_accuracy)) * 10;
  const comm = mean(evals.map((e) => e.communication)) * 10;
  const comp = mean(evals.map((e) => e.completeness)) * 10;
  const overall = mean(evals.map((e) => e.score)) * 10;
  // "Confidence" is a proxy: consistency of scores plus communication. It is not measured directly.
  const scores = evals.map((e) => e.score);
  const spread = scores.length > 1 ? Math.max(...scores) - Math.min(...scores) : 0;
  const confidence = Math.max(0, Math.min(100, comm * 0.7 + (10 - spread) * 3));

  let strong = [];
  let weak = [];
  for (const e of evals) {
    const topics = extractSkills(e.question);
    const label = topics.length ? topics[0] : 'General fundamentals';
    if (e.score >= 7) strong.push(label);
    else if (e.score < 5.5) weak.push(label);
  }

  const llm = await completeJson(
    'You summarise interview performance.',
    `Role: ${role}\nPer-question results:\n` +
      evals.map((e) => `- ${e.question} -> ${e.score}/10; improve: ${(e.improvements || []).join('; ')}`).join('\n') +
      '\nReturn JSON {"strong_areas": ["short topic names"], "needs_improvement": ["short topic names"]} (max 5 each).',
    500
  );
  if (llm) {
    const s = (llm.strong_areas || []).map(String).slice(0, 5);
    const w = (llm.needs_improvement || []).map(String).slice(0, 5);
    strong = s.length ? s : strong;
    weak = w.length ? w : weak;
  }

  const dedupe = (xs) => [...new Set(xs)].slice(0, 5);
  return {
    overall_score: Math.round(overall),
    technical_knowledge: Math.round(tech),
    communication: Math.round(comm),
    problem_solving: Math.round(comp),
    confidence: Math.round(confidence),
    strong_areas: dedupe(strong),
    needs_improvement: dedupe(weak),
  };
}

module.exports = { generate, evaluate, report };

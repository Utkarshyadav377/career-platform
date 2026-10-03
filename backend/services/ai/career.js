// Career recommendations from resume, applications, matches and interview results.
const { completeJson } = require('./llm');
const { categoryOf, extractSkills } = require('./skills');

const PROFILES = {
  'ML / Data Science': {
    core: ['Python', 'SQL', 'Machine Learning', 'Pandas', 'Scikit-learn', 'Statistics', 'Docker', 'AWS'],
    projects: ['Real-time fraud detection pipeline', 'Recommendation system with evaluation', 'LLM RAG application with a vector database'],
  },
  GenAI: {
    core: ['Python', 'LLMs', 'RAG', 'FastAPI', 'Docker', 'SQL', 'AWS'],
    projects: ['RAG chatbot over your own documents with evaluation', 'Agent that calls tools with guardrails', 'Fine-tune/evaluate a small model on a custom task'],
  },
  Web: {
    core: ['JavaScript', 'React', 'Node.js', 'SQL', 'REST APIs', 'Docker', 'Git', 'System Design'],
    projects: ['Full-stack SaaS app with auth and payments', 'Real-time chat with WebSockets', 'Performance-optimised dashboard with caching'],
  },
  Fundamentals: {
    core: ['Data Structures & Algorithms', 'System Design', 'OOP', 'SQL', 'Operating Systems', 'Git'],
    projects: ['Build a key-value store from scratch', 'URL shortener with rate limiting', 'Task scheduler / job queue'],
  },
  'Cloud / DevOps': {
    core: ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Git'],
    projects: ['CI/CD pipeline deploying to the cloud', 'Infrastructure monitoring dashboard', 'Containerised microservices on Kubernetes'],
  },
};

const tally = (items) => {
  const m = new Map();
  items.forEach((i) => m.set(i, (m.get(i) || 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

function heuristic(req) {
  const skills = [...new Set([...extractSkills(req.resume_text), ...(req.profile_skills || [])])];
  const cats = new Map();
  skills.forEach((s) => cats.set(categoryOf(s), (cats.get(categoryOf(s)) || 0) + 1));
  ['Languages', 'Data', 'Other'].forEach((c) => cats.delete(c));

  const target = (req.target_role || '').toLowerCase();
  let profile;
  if (/\bml\b|machine learning|data/.test(target)) profile = 'ML / Data Science';
  else if (/\bai\b|\bllm\b|genai/.test(target)) profile = 'GenAI';
  else if (['web', 'full', 'front', 'back', 'sde', 'software'].some((k) => target.includes(k))) profile = 'Web';
  else if (cats.size) {
    const top = [...cats.entries()].sort((a, b) => b[1] - a[1])[0][0];
    profile = PROFILES[top] ? top : 'Fundamentals';
  } else profile = 'Fundamentals';

  const missingCounts = tally((req.job_matches || []).flatMap((j) => j.missing_skills || []));
  const weakInterview = tally((req.interviews || []).flatMap((i) => i.needs_improvement || []));
  const missingMap = new Map(missingCounts);

  const have = new Set(skills.map((s) => s.toLowerCase()));
  const gaps = PROFILES[profile].core.filter((s) => !have.has(s.toLowerCase()));
  const weakAreas = [...new Set([...missingCounts.slice(0, 4).map(([s]) => s), ...weakInterview.slice(0, 3).map(([s]) => s), ...gaps])].slice(0, 6);

  const ranked = [...new Set([...missingCounts.map(([s]) => s), ...gaps])];
  const priority = ranked.slice(0, 3).map((s, i) => ({
    priority: i + 1,
    skill: s,
    reason: missingMap.get(s)
      ? `Missing in ${missingMap.get(s)} of your saved job matches`
      : `Core skill for ${profile} roles that your resume does not show`,
  }));

  const core = PROFILES[profile].core;
  return {
    current_profile: profile,
    strongest_skills: skills.filter((s) => core.includes(s)).slice(0, 6).length
      ? skills.filter((s) => core.includes(s)).slice(0, 6)
      : skills.slice(0, 6),
    weak_areas: weakAreas,
    recommended_projects: PROFILES[profile].projects,
    recommended_skills: priority,
    summary: 'Generated from rule-based analysis. Set GROQ_API_KEY for a personalised narrative.',
  };
}

async function recommend(req) {
  const base = heuristic(req);
  const ctx = {
    target_role: req.target_role,
    profile_skills: req.profile_skills,
    applications: (req.applications || []).slice(0, 30),
    interviews: (req.interviews || []).slice(0, 10),
    job_matches: (req.job_matches || []).slice(0, 15),
  };
  const data = await completeJson(
    'You are a pragmatic career coach for early-career software/AI candidates. Ground every point in the data given.',
    'Analyse this candidate and return JSON with keys: current_profile (short string), strongest_skills (list), ' +
      'weak_areas (list), recommended_projects (3 concrete project ideas), ' +
      'recommended_skills (list of {priority:int, skill, reason}, max 3), summary (2-3 sentences).\n\n' +
      `RESUME:\n${(req.resume_text || '').slice(0, 4000)}\n\nCONTEXT: ${JSON.stringify(ctx)}`,
    1500
  );
  if (!data) return base;
  try {
    const rs = (data.recommended_skills || [])
      .slice(0, 3)
      .filter((x) => x && typeof x === 'object' && x.skill)
      .map((x, i) => ({ priority: parseInt(x.priority, 10) || i + 1, skill: String(x.skill), reason: String(x.reason || '') }));
    const list = (v, n, fb) => {
      const out = (v || []).map(String).slice(0, n);
      return out.length ? out : fb;
    };
    return {
      current_profile: String(data.current_profile || base.current_profile),
      strongest_skills: list(data.strongest_skills, 8, base.strongest_skills),
      weak_areas: list(data.weak_areas, 8, base.weak_areas),
      recommended_projects: list(data.recommended_projects, 5, base.recommended_projects),
      recommended_skills: rs.length ? rs : base.recommended_skills,
      summary: String(data.summary || '').slice(0, 600),
    };
  } catch {
    return base;
  }
}

module.exports = { recommend };

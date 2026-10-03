// Resume <-> job description matching.
const { completeJson } = require('./llm');
const { extractSkills } = require('./skills');

const LEARNING_HINTS = {
  AWS: 'AWS fundamentals (EC2, S3, Lambda, IAM)',
  Docker: 'Docker: containerise one of your projects',
  Kubernetes: 'Kubernetes basics after Docker',
  SQL: 'SQL: joins, window functions, query optimisation',
  'Deep Learning': 'Deep Learning with PyTorch (build and train a CNN/transformer)',
  'System Design': 'System design fundamentals and trade-offs',
  'CI/CD': 'CI/CD with GitHub Actions',
  LLMs: 'LLM app development and prompt engineering',
  RAG: 'Build a RAG app with a vector database',
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');

function yearsRequired(jd) {
  const m = [...jd.matchAll(/(\d+)\s*\+?\s*(?:-\s*\d+\s*)?(?:years|yrs)/gi)].map((x) => parseInt(x[1], 10));
  return m.length ? Math.max(...m) : null;
}

function yearsHave(resume) {
  const m = [...resume.matchAll(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years|yrs)/gi)].map((x) => parseFloat(x[1]));
  if (m.length) return Math.max(...m);
  return /intern/i.test(resume) ? 0.5 : 0.0;
}

async function match(resumeText, jd) {
  let jdSkills = extractSkills(jd);
  const llm = await completeJson(
    'You extract the technical skills a job description requires.',
    'Return JSON {"required_skills": [...]} using short canonical names (e.g. "Python", "AWS", "Deep Learning").\n\nJOB DESCRIPTION:\n' +
      jd.slice(0, 5000),
    600
  );
  if (llm && Array.isArray(llm.required_skills) && llm.required_skills.length) {
    jdSkills = [...new Set(llm.required_skills.map((s) => String(s).trim()).filter(Boolean))].slice(0, 25);
  }

  const resumeLower = resumeText.toLowerCase();
  const resumeSkills = new Set(extractSkills(resumeText).map((s) => s.toLowerCase()));

  const matched = [];
  const missing = [];
  for (const s of jdSkills) {
    const present =
      resumeSkills.has(s.toLowerCase()) ||
      new RegExp(`(?<![a-z0-9+#])${escapeRe(s.toLowerCase())}(?![a-z0-9+#])`).test(resumeLower);
    (present ? matched : missing).push(s);
  }

  const skillsPct = jdSkills.length ? Math.round((100 * matched.length) / jdSkills.length) : 50;

  const need = yearsRequired(jd);
  const have = yearsHave(resumeText);
  let expPct;
  if (need === null) expPct = have > 0 ? 80 : 60;
  else expPct = need ? Math.min(100, Math.round((100 * have) / need)) : 100;
  expPct = Math.max(expPct, 20);

  const jdLow = jd.toLowerCase();
  const wantsDegree = /b\.?tech|bachelor|master|m\.?tech|degree|computer science|engineering/.test(jdLow);
  const hasDegree = /b\.?tech|btech|bachelor|master|m\.?tech|b\.?e\b|b\.?sc|university|institute/.test(resumeLower);
  const eduPct = hasDegree || !wantsDegree ? 95 : 55;

  const idx = resumeLower.indexOf('project');
  const projSection = idx >= 0 ? resumeLower.slice(idx + 'project'.length) : '';
  const projectHits = matched.filter((s) => projSection.includes(s.toLowerCase())).length;
  let projPct = matched.length ? Math.round((100 * projectHits) / matched.length) : 0;
  projPct = Math.trunc(0.5 * projPct + 0.5 * skillsPct);

  const overall = Math.round(skillsPct * 0.5 + expPct * 0.2 + eduPct * 0.1 + projPct * 0.2);

  const learning = missing
    .slice(0, 5)
    .map((s) => LEARNING_HINTS[s] || `${s}: learn the fundamentals and apply it in a small project`);

  return {
    overall_score: overall,
    breakdown: { skills: skillsPct, experience: expPct, education: eduPct, projects: projPct },
    matched_skills: matched,
    missing_skills: missing,
    recommended_learning: learning,
  };
}

module.exports = { match };

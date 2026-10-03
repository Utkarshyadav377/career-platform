// Resume analysis: rule-based scoring, optionally refined by an LLM.
const { clamp, completeJson } = require('./llm');
const { extractSkills } = require('./skills');

const WEAK_STARTS = /^\W*(worked on|worked with|responsible for|helped|assisted|involved in|participated in|made|did|used)\b/i;
const ACTION_VERBS = /\b(built|developed|designed|implemented|created|led|optimi[sz]ed|reduced|improved|increased|deployed|automated|architected|engineered|launched|trained|achieved|won|ranked)\b/gi;
const METRIC = /\d+(\.\d+)?\s*(%|x|k|ms|\+)|\b\d{2,}\b|\$\s?\d+/gi;

const has = (text, ...words) => {
  const low = text.toLowerCase();
  return words.some((w) => low.includes(w));
};
const count = (re, text) => (text.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')) || []).length;

function heuristic(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  const skills = extractSkills(text);
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => l.split(/\s+/).length >= 5);

  // ATS: standard sections, contact info, sane length
  let ats = 40;
  for (const section of ['education', 'experience', 'project', 'skill']) if (has(text, section)) ats += 10;
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(text)) ats += 7;
  if (/\+?\d[\d\s-]{8,}/.test(text)) ats += 3;
  if (words >= 250 && words <= 1100) ats += 10;
  else if (words < 150) ats -= 15;

  const technical = Math.min(100, 30 + skills.length * 6);

  let exp = 35;
  if (has(text, 'experience', 'intern', 'work history')) exp += 25;
  const verbs = count(ACTION_VERBS, text);
  exp += Math.min(30, verbs * 3);
  if (/\b(20\d\d)\b.{0,15}(20\d\d|present)/i.test(text)) exp += 10;

  let proj = 25;
  if (has(text, 'project')) proj += 25;
  proj += Math.min(30, skills.length * 2);
  if (/github\.com|deployed|live demo|vercel|render|heroku/i.test(text)) proj += 15;

  let edu = 40;
  if (has(text, 'b.tech', 'btech', 'bachelor', 'b.e', 'b.sc', 'm.tech', 'master', 'university', 'institute', 'iit', 'nit')) edu += 35;
  if (/\b(cgpa|gpa)\b|\b\d\.\d{1,2}\s*\/\s*10\b|\b\d{2}(\.\d+)?\s*%/i.test(text)) edu += 15;
  if (has(text, 'coursework', 'course')) edu += 5;

  const metrics = count(METRIC, text);
  let ach = 25 + Math.min(45, metrics * 5);
  if (has(text, 'award', 'rank', 'winner', 'won', 'hackathon', 'scholarship', 'certif', 'olympiad', 'competition')) ach += 20;

  const raw = { ats, technical_skills: technical, experience: exp, projects: proj, education: edu, achievements: ach };
  const breakdown = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Math.round(clamp(v))]));

  const suggestions = [];
  const weak = bullets.filter((b) => WEAK_STARTS.test(b) && !new RegExp(METRIC.source, 'i').test(b)).slice(0, 3);
  for (const b of weak) {
    suggestions.push({
      issue: 'Vague bullet with no measurable result',
      current: b.slice(0, 200),
      improved:
        "Start with a strong verb, name the tech, and add a number (accuracy, latency, users, dataset size). e.g. 'Built <what> using <tech>, achieving <metric> on <scale>.'",
    });
  }
  if (metrics < 4) {
    suggestions.push({
      issue: 'Your resume lacks measurable achievements',
      current: '',
      improved: 'Add at least one quantified result to every project and role (%, counts, time saved).',
    });
  }
  if (!has(text, 'project')) suggestions.push({ issue: 'No projects section found', current: '', improved: 'Add 2-3 projects with stack, your role and outcome.' });
  if (!/github\.com|linkedin\.com/i.test(text)) suggestions.push({ issue: 'No GitHub/LinkedIn link found', current: '', improved: 'Add profile links in the header so recruiters can verify your work.' });
  if (words > 1100) suggestions.push({ issue: 'Resume is long', current: `${words} words`, improved: 'Trim to one page for early-career roles.' });
  if (skills.length < 5) suggestions.push({ issue: 'Few recognisable technical skills', current: skills.join(', '), improved: 'List your core tools in a dedicated Skills section using standard names.' });

  const overall = Math.round(
    breakdown.ats * 0.15 +
      breakdown.technical_skills * 0.25 +
      breakdown.experience * 0.15 +
      breakdown.projects * 0.2 +
      breakdown.education * 0.1 +
      breakdown.achievements * 0.15
  );
  return {
    overall_score: overall,
    breakdown,
    skills,
    suggestions: suggestions.slice(0, 6),
    summary: `Detected ${skills.length} recognised skills across ${words} words. Scores come from rule-based checks; set GROQ_API_KEY for a deeper AI review.`,
  };
}

const SYSTEM =
  'You are an expert technical recruiter and resume reviewer. Be specific, honest and constructive. ' +
  'Never invent facts that are not in the resume; when proposing a rewrite with numbers, make clear ' +
  'the numbers are placeholders for the candidate to replace with real figures.';

async function analyze(text, targetRole = '') {
  const base = heuristic(text);
  const prompt = `Review this resume${targetRole ? ' for a ' + targetRole + ' role' : ''}.
Return JSON with keys:
overall_score (0-100), breakdown {ats, technical_skills, experience, projects, education, achievements} (each 0-100),
skills (list of technical skills actually present), summary (2-3 sentences),
suggestions (up to 6 items of {issue, current, improved} where current quotes a real line from the resume
and improved is a stronger rewrite using [X]-style placeholders for unknown numbers).

RESUME:
${text.slice(0, 9000)}`;
  const data = await completeJson(SYSTEM, prompt, 2500);
  if (!data) return base;
  try {
    const bd = data.breakdown || {};
    const breakdown = Object.fromEntries(
      Object.keys(base.breakdown).map((k) => [k, Math.round(clamp(bd[k], 0, 100, base.breakdown[k]))])
    );
    const suggestions = (data.suggestions || [])
      .filter((s) => s && typeof s === 'object' && s.issue)
      .map((s) => ({
        issue: String(s.issue).slice(0, 200),
        current: String(s.current || '').slice(0, 300),
        improved: String(s.improved || '').slice(0, 400),
      }))
      .slice(0, 6);
    const skills = (data.skills || []).map(String).slice(0, 40);
    return {
      overall_score: Math.round(clamp(data.overall_score, 0, 100, base.overall_score)),
      breakdown,
      skills: skills.length ? skills : base.skills,
      suggestions: suggestions.length ? suggestions : base.suggestions,
      summary: String(data.summary || base.summary).slice(0, 600),
    };
  } catch {
    return base;
  }
}

module.exports = { analyze };

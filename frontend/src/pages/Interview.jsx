import { useEffect, useState } from 'react';
import { Chip, ErrorBox, ScoreBar } from '../components/ui.jsx';
import { api } from '../services/api.js';

const ROLES = ['Data Scientist', 'ML Engineer', 'AI Engineer', 'Software Engineer (SDE)', 'Frontend Developer', 'Backend Developer', 'Full-Stack Developer'];

function Report({ interview, onRestart }) {
  const r = interview.report || {};
  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="h2">Interview report</h2>
        <div className="mb-4 text-4xl font-semibold">{interview.score}%</div>
        <ScoreBar label="Technical knowledge" value={r.technicalKnowledge ?? 0} />
        <ScoreBar label="Communication" value={r.communication ?? 0} />
        <ScoreBar label="Problem solving (completeness)" value={r.problemSolving ?? 0} />
        <ScoreBar label="Confidence (estimated)" value={r.confidence ?? 0} />
        <p className="mt-2 text-xs text-slate-400">Confidence is an estimate from answer consistency and communication, not a direct measurement.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <div className="mb-1 font-medium">Strong areas</div>
            <div className="flex flex-wrap gap-1.5">{r.strongAreas?.length ? r.strongAreas.map((s) => <Chip key={s} tone="green">✓ {s}</Chip>) : <span className="text-slate-400">—</span>}</div>
          </div>
          <div>
            <div className="mb-1 font-medium">Needs improvement</div>
            <div className="flex flex-wrap gap-1.5">{r.needsImprovement?.length ? r.needsImprovement.map((s) => <Chip key={s} tone="amber">⚠ {s}</Chip>) : <span className="text-slate-400">—</span>}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="h2">Question by question</h2>
        <div className="space-y-3 text-sm">
          {interview.answers.map((a, i) => (
            <details key={i} className="rounded-lg border border-slate-200 p-3">
              <summary className="cursor-pointer font-medium">Q{i + 1}. {interview.questions[i]} <span className="ml-2 text-slate-500">({a.score}/10)</span></summary>
              <p className="mt-2 whitespace-pre-wrap text-slate-600">{a.answer}</p>
              {a.improvements?.map((t, k) => <div key={k} className="mt-1 text-amber-700">Improve: {t}</div>)}
            </details>
          ))}
        </div>
      </div>
      <button className="btn" onClick={onRestart}>Start a new interview</button>
    </div>
  );
}

export default function Interview() {
  const [setup, setSetup] = useState({ role: ROLES[0], difficulty: 'Medium', type: 'Technical', numQuestions: 10 });
  const [interview, setInterview] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [answer, setAnswer] = useState('');
  const [past, setPast] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadPast = () => api.interviews().then((d) => setPast(d.interviews)).catch(() => {});
  useEffect(() => { loadPast(); }, []);

  const start = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const d = await api.startInterview(setup);
      setInterview(d.interview);
      setEvaluation(null);
      setAnswer('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const d = await api.answerInterview(interview._id, answer);
      setInterview(d.interview);
      setEvaluation(d.evaluation);
      loadPast();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const openPast = async (id) => {
    try {
      const d = await api.interview(id);
      setInterview(d.interview);
      setEvaluation(null);
    } catch (err) { setError(err.message); }
  };

  const reset = () => { setInterview(null); setEvaluation(null); setAnswer(''); };
  const done = interview?.status === 'completed';
  const idx = interview ? interview.answers.length : 0;
  // After submitting, we show the evaluation for the answer just given until the user clicks Next.
  const showingEval = !!evaluation;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h1">AI Interviewer</h1>
        <p className="text-sm text-slate-500">Practice with role-specific questions and get scored feedback after each answer.</p>
      </div>
      <ErrorBox message={error} />

      {!interview && (
        <>
          <form onSubmit={start} className="card grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="label">Role</label>
              <input className="input" list="roles" value={setup.role} onChange={(e) => setSetup({ ...setup, role: e.target.value })} />
              <datalist id="roles">{ROLES.map((r) => <option key={r} value={r} />)}</datalist>
            </div>
            <div>
              <label className="label">Difficulty</label>
              <select className="input" value={setup.difficulty} onChange={(e) => setSetup({ ...setup, difficulty: e.target.value })}>
                {['Easy', 'Medium', 'Hard'].map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={setup.type} onChange={(e) => setSetup({ ...setup, type: e.target.value })}>
                {['Technical', 'Behavioral'].map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="sm:col-span-4"><button className="btn" disabled={busy}>{busy ? 'Preparing questions…' : 'Start interview'}</button></div>
          </form>

          {past.length > 0 && (
            <div className="card">
              <h2 className="h2">Past interviews</h2>
              <table className="w-full text-sm">
                <tbody>
                  {past.map((p) => (
                    <tr key={p._id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 font-medium">{p.role}</td>
                      <td className="py-2 text-slate-600">{p.type} · {p.difficulty}</td>
                      <td className="py-2 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="py-2 text-right">
                        {p.status === 'completed' ? <button className="text-brand-600 hover:underline" onClick={() => openPast(p._id)}>{p.score}% · view</button> : <span className="text-slate-400">unfinished</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {interview && done && !showingEval && <Report interview={interview} onRestart={reset} />}

      {interview && (!done || showingEval) && (
        <div className="space-y-4">
          {/* current question, or the one just answered while showing feedback */}
          <div className="card">
            <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
              <span>Question {Math.min(showingEval ? idx : idx + 1, interview.questions.length)}/{interview.questions.length}</span>
              <span>{interview.role} · {interview.difficulty}</span>
            </div>
            <div className="text-lg font-medium text-slate-900">{interview.questions[showingEval ? idx - 1 : idx]}</div>
          </div>

          {showingEval ? (
            <div className="card">
              <div className="mb-3 text-2xl font-semibold">Score: {evaluation.score}/10</div>
              <ScoreBar label="Technical accuracy" value={evaluation.technicalAccuracy} max={10} />
              <ScoreBar label="Communication" value={evaluation.communication} max={10} />
              <ScoreBar label="Completeness" value={evaluation.completeness} max={10} />
              <div className="mt-3 space-y-1 text-sm">
                {evaluation.strengths?.map((s, i) => <div key={i} className="text-emerald-700">✓ {s}</div>)}
                {evaluation.improvements?.map((s, i) => <div key={i} className="text-amber-700">Improve: {s}</div>)}
              </div>
              <div className="mt-4">
                <button className="btn" onClick={() => { setEvaluation(null); setAnswer(''); }}>{done ? 'View report →' : 'Next question →'}</button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="card space-y-3">
              <textarea className="input" rows={7} required placeholder="Type your answer…" value={answer} onChange={(e) => setAnswer(e.target.value)} />
              <div className="flex items-center gap-3">
                <button className="btn" disabled={busy}>{busy ? 'Evaluating…' : 'Submit answer'}</button>
                <button type="button" className="btn-ghost" onClick={reset}>Quit</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

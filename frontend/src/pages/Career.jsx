import { useState } from 'react';
import { Chip, ErrorBox } from '../components/ui.jsx';
import { api } from '../services/api.js';

export default function Career() {
  const [rec, setRec] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setError('');
    setBusy(true);
    try {
      setRec((await api.recommendations()).recommendation);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1">Career Recommendations</h1>
          <p className="text-sm text-slate-500">Based on your resume, skills, job matches, applications and interview results.</p>
        </div>
        <button className="btn" onClick={generate} disabled={busy}>{busy ? 'Analyzing…' : rec ? 'Regenerate' : 'Generate my analysis'}</button>
      </div>
      <ErrorBox message={error} />

      {rec && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card md:col-span-2">
            <div className="text-xs uppercase tracking-wide text-slate-400">Current profile</div>
            <div className="text-xl font-semibold">{rec.current_profile}</div>
            {rec.summary && <p className="mt-2 text-sm text-slate-600">{rec.summary}</p>}
          </div>
          <div className="card">
            <h2 className="h2">Strongest skills</h2>
            <div className="flex flex-wrap gap-1.5">{rec.strongest_skills.map((s) => <Chip key={s} tone="green">{s}</Chip>)}</div>
          </div>
          <div className="card">
            <h2 className="h2">Weak areas</h2>
            <div className="flex flex-wrap gap-1.5">{rec.weak_areas.map((s) => <Chip key={s} tone="amber">{s}</Chip>)}</div>
          </div>
          <div className="card">
            <h2 className="h2">Recommended projects</h2>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">{rec.recommended_projects.map((p, i) => <li key={i}>{p}</li>)}</ol>
          </div>
          <div className="card">
            <h2 className="h2">Recommended skills</h2>
            <ul className="space-y-2 text-sm">
              {rec.recommended_skills.map((s) => (
                <li key={s.skill}>
                  <span className="font-medium">Priority {s.priority} → {s.skill}</span>
                  {s.reason && <div className="text-slate-500">{s.reason}</div>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

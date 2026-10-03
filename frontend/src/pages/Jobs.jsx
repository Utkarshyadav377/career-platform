import { useEffect, useState } from 'react';
import JobCard, { STATUSES } from '../components/JobCard.jsx';
import { Chip, ErrorBox, ScoreBar, scoreColor } from '../components/ui.jsx';
import { api } from '../services/api.js';

const emptyApp = { company: '', role: '', location: '', salary: '', applicationDate: '', status: 'Applied', jobUrl: '', notes: '', nextInterview: '' };

function Tracker() {
  const [apps, setApps] = useState([]);
  const [form, setForm] = useState(emptyApp);
  const [filter, setFilter] = useState('All');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.applications().then((d) => setApps(d.applications)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    setError('');
    const body = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
    try {
      await api.createApplication(body);
      setForm(emptyApp);
      setShow(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const changeStatus = async (job, status) => {
    try { await api.updateApplication(job._id, { status }); load(); } catch (err) { setError(err.message); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this application?')) return;
    try { await api.deleteApplication(id); load(); } catch (err) { setError(err.message); }
  };

  const shown = filter === 'All' ? apps : apps.filter((a) => a.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {['All', ...STATUSES].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filter === s ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
              {s}
            </button>
          ))}
        </div>
        <button className="btn" onClick={() => setShow(!show)}>{show ? 'Cancel' : '+ Add application'}</button>
      </div>
      <ErrorBox message={error} />

      {show && (
        <form onSubmit={add} className="card grid gap-3 sm:grid-cols-2">
          <div><label className="label">Company *</label><input className="input" required value={form.company} onChange={set('company')} /></div>
          <div><label className="label">Role *</label><input className="input" required value={form.role} onChange={set('role')} /></div>
          <div><label className="label">Location</label><input className="input" value={form.location} onChange={set('location')} /></div>
          <div><label className="label">Salary</label><input className="input" value={form.salary} onChange={set('salary')} /></div>
          <div><label className="label">Application date</label><input className="input" type="date" value={form.applicationDate} onChange={set('applicationDate')} /></div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={set('status')}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          </div>
          <div><label className="label">Next interview</label><input className="input" type="date" value={form.nextInterview} onChange={set('nextInterview')} /></div>
          <div><label className="label">Job URL</label><input className="input" type="url" value={form.jobUrl} onChange={set('jobUrl')} /></div>
          <div className="sm:col-span-2"><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={set('notes')} /></div>
          <div className="sm:col-span-2"><button className="btn">Save application</button></div>
        </form>
      )}

      {shown.length === 0 ? (
        <div className="card text-sm text-slate-500">No applications here yet.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((j) => <JobCard key={j._id} job={j} onStatus={changeStatus} onDelete={remove} />)}
        </div>
      )}
    </div>
  );
}

function Matcher() {
  const [form, setForm] = useState({ company: '', role: '', description: '' });
  const [result, setResult] = useState(null);
  const [past, setPast] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadPast = () => api.matches().then((d) => setPast(d.jobs)).catch(() => {});
  useEffect(() => { loadPast(); }, []);

  const run = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const d = await api.matchJob(form);
      setResult(d.job);
      loadPast();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={run} className="card space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Company (optional)</label><input className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
          <div><label className="label">Role (optional)</label><input className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
        </div>
        <div>
          <label className="label">Job description</label>
          <textarea className="input" rows={8} required placeholder="Paste the job description here…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button className="btn" disabled={busy}>{busy ? 'Matching…' : 'Match against my latest resume'}</button>
      </form>
      <ErrorBox message={error} />

      {result && (
        <div className="card">
          <h2 className="h2">Job match score</h2>
          <div className="mb-4 flex items-center gap-3">
            <div className="h-3 flex-1 rounded-full bg-slate-100"><div className={`h-3 rounded-full ${scoreColor(result.matchScore)}`} style={{ width: `${result.matchScore}%` }} /></div>
            <div className="text-2xl font-semibold">{result.matchScore}%</div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <ScoreBar label="Skills match" value={result.breakdown.skills} />
              <ScoreBar label="Experience match" value={result.breakdown.experience} />
              <ScoreBar label="Education match" value={result.breakdown.education} />
              <ScoreBar label="Project match" value={result.breakdown.projects} />
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <div className="mb-1 font-medium">Matched skills</div>
                <div className="flex flex-wrap gap-1.5">{result.matchedSkills.length ? result.matchedSkills.map((s) => <Chip key={s} tone="green">✓ {s}</Chip>) : <span className="text-slate-400">None found</span>}</div>
              </div>
              <div>
                <div className="mb-1 font-medium">Missing skills</div>
                <div className="flex flex-wrap gap-1.5">{result.missingSkills.length ? result.missingSkills.map((s) => <Chip key={s} tone="amber">⚠ {s}</Chip>) : <span className="text-slate-400">Nothing missing</span>}</div>
              </div>
              {result.recommendedLearning.length > 0 && (
                <div>
                  <div className="mb-1 font-medium">Recommended learning</div>
                  <ol className="list-decimal space-y-1 pl-5 text-slate-600">{result.recommendedLearning.map((l, i) => <li key={i}>{l}</li>)}</ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="card">
          <h2 className="h2">Previous matches</h2>
          <table className="w-full text-sm">
            <tbody>
              {past.map((j) => (
                <tr key={j._id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 font-medium">{j.company || '—'}</td>
                  <td className="py-2 text-slate-600">{j.role || '—'}</td>
                  <td className="py-2 text-slate-500">{new Date(j.createdAt).toLocaleDateString()}</td>
                  <td className="py-2 text-right font-medium">{j.matchScore}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Jobs() {
  const [tab, setTab] = useState('tracker');
  return (
    <div className="space-y-5">
      <div>
        <h1 className="h1">Jobs</h1>
        <p className="text-sm text-slate-500">Track applications and check how well your resume fits a role.</p>
      </div>
      <div className="flex gap-1 border-b border-slate-200">
        {[['tracker', 'Application tracker'], ['match', 'Job description matcher']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === k ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'tracker' ? <Tracker /> : <Matcher />}
    </div>
  );
}

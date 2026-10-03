import { useEffect, useRef, useState } from 'react';
import ResumeCard from '../components/ResumeCard.jsx';
import { ErrorBox } from '../components/ui.jsx';
import { api } from '../services/api.js';

export default function Resume() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const load = () => api.resumes().then((d) => setResumes(d.resumes)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return setError('Choose a PDF first');
    setError('');
    setBusy(true);
    try {
      await api.uploadResume(file);
      fileRef.current.value = '';
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this resume?')) return;
    try { await api.deleteResume(id); await load(); } catch (err) { setError(err.message); }
  };

  const latest = resumes[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">AI Resume Analyzer</h1>
        <p className="text-sm text-slate-500">Upload a PDF resume to get a score, skill extraction and rewrite suggestions.</p>
      </div>

      <form onSubmit={upload} className="card flex flex-wrap items-center gap-3">
        <input ref={fileRef} type="file" accept="application/pdf" className="text-sm" />
        <button className="btn" disabled={busy}>{busy ? 'Analyzing…' : 'Upload & analyze'}</button>
        <span className="text-xs text-slate-400">PDF only, max 5 MB. Scanned images can't be read.</span>
      </form>
      <ErrorBox message={error} />

      {loading ? (
        <div className="text-slate-500">Loading…</div>
      ) : !latest ? (
        <div className="card text-sm text-slate-500">No resume yet. Upload one above.</div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <ResumeCard resume={latest} onDelete={remove} />
            <div className="card">
              <h2 className="h2">Recommendations</h2>
              {latest.suggestions?.length ? (
                <div className="space-y-4">
                  {latest.suggestions.map((s, i) => (
                    <div key={i} className="rounded-lg border border-slate-200 p-3 text-sm">
                      <div className="font-medium text-rose-700">❌ {s.issue}</div>
                      {s.current && <div className="mt-2 text-slate-500"><span className="font-medium text-slate-700">Current:</span> “{s.current}”</div>}
                      {s.improved && <div className="mt-1 text-emerald-700"><span className="font-medium">Suggestion:</span> {s.improved}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">No issues flagged.</div>
              )}
            </div>
          </div>

          {resumes.length > 1 && (
            <div>
              <h2 className="h2">Previous uploads</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {resumes.slice(1).map((r) => <ResumeCard key={r._id} resume={r} onDelete={remove} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { Chip, ScoreBar } from './ui.jsx';

export default function ResumeCard({ resume, onDelete }) {
  const b = resume.breakdown || {};
  return (
    <div className="card">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-slate-900">{resume.fileName}</div>
          <div className="text-xs text-slate-500">{new Date(resume.createdAt).toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold text-slate-900">{resume.score}<span className="text-base text-slate-400">/100</span></div>
          {onDelete && <button className="text-xs text-rose-600 hover:underline" onClick={() => onDelete(resume._id)}>Delete</button>}
        </div>
      </div>
      <ScoreBar label="ATS Compatibility" value={b.ats ?? 0} />
      <ScoreBar label="Technical Skills" value={b.technicalSkills ?? 0} />
      <ScoreBar label="Experience" value={b.experience ?? 0} />
      <ScoreBar label="Projects" value={b.projects ?? 0} />
      <ScoreBar label="Education" value={b.education ?? 0} />
      <ScoreBar label="Achievements" value={b.achievements ?? 0} />
      {resume.summary && <p className="mt-3 text-sm text-slate-600">{resume.summary}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {resume.skills?.map((s) => <Chip key={s} tone="blue">{s}</Chip>)}
      </div>
    </div>
  );
}

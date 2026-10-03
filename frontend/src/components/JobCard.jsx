import { Chip } from './ui.jsx';

export const STATUSES = ['Saved', 'Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];

export const statusTone = {
  Saved: 'slate',
  Applied: 'blue',
  Screening: 'amber',
  Interview: 'amber',
  Offer: 'green',
  Rejected: 'red',
};

const fmt = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : null);

export default function JobCard({ job, onStatus, onDelete }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium text-slate-900">{job.company}</div>
          <div className="text-sm text-slate-600">{job.role}{job.location ? ` · ${job.location}` : ''}</div>
        </div>
        <Chip tone={statusTone[job.status]}>{job.status}</Chip>
      </div>
      <div className="mt-2 space-y-0.5 text-xs text-slate-500">
        {job.salary && <div>Salary: {job.salary}</div>}
        {job.applicationDate && <div>Applied: {fmt(job.applicationDate)}</div>}
        {job.nextInterview && <div>Next interview: {fmt(job.nextInterview)}</div>}
        {job.jobUrl && (
          <a className="text-brand-600 hover:underline" href={job.jobUrl} target="_blank" rel="noreferrer">Job posting ↗</a>
        )}
      </div>
      {job.notes && <p className="mt-2 text-sm text-slate-600">{job.notes}</p>}
      <div className="mt-3 flex items-center gap-2">
        <select className="input !w-auto !py-1" value={job.status} onChange={(e) => onStatus(job, e.target.value)}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="text-xs text-rose-600 hover:underline" onClick={() => onDelete(job._id)}>Delete</button>
      </div>
    </div>
  );
}

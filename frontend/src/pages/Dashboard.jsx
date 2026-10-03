import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Chip, ErrorBox } from '../components/ui.jsx';
import { statusTone } from '../components/JobCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

const Stat = ({ label, value }) => (
  <div className="card text-center">
    <div className="text-3xl font-semibold text-slate-900">{value}</div>
    <div className="text-sm text-slate-500">{label}</div>
  </div>
);

const ChartCard = ({ title, empty, children }) => (
  <div className="card">
    <h2 className="h2">{title}</h2>
    {empty ? <div className="flex h-52 items-center justify-center text-sm text-slate-400">{empty}</div> : <div className="h-52">{children}</div>}
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!data) return <div className="text-slate-500">Loading dashboard…</div>;

  const conv = data.interviewConversion;
  const convData = [
    { name: 'Reached interview', value: conv.interviewed },
    { name: 'Did not', value: Math.max(conv.applied - conv.interviewed, 0) },
  ];
  const resumeHistory = data.resumeScoreHistory.map((r) => ({
    date: new Date(r.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    score: r.score,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">Welcome, {user.name} 👋</h1>
        <p className="text-sm text-slate-500">Here's where your job search stands.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Applications" value={data.totals.applications} />
        <Stat label="Interviews" value={data.totals.interviews} />
        <Stat label="Offers" value={data.totals.offers} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="h2">Application status</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(data.statusCounts).map(([s, n]) => (
              <div key={s} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <Chip tone={statusTone[s]}>{s}</Chip>
                <span className="font-medium">{n}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="h2">Recent applications</h2>
          {data.recentApplications.length === 0 ? (
            <div className="text-sm text-slate-400">No applications yet. <Link className="text-brand-600 underline" to="/jobs">Add one</Link>.</div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {data.recentApplications.map((a) => (
                  <tr key={a._id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 font-medium">{a.company}</td>
                    <td className="py-2 text-slate-600">{a.role}</td>
                    <td className="py-2 text-right"><Chip tone={statusTone[a.status]}>{a.status}</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Application funnel" empty={data.totals.applications === 0 && 'No data yet'}>
          <ResponsiveContainer>
            <BarChart data={data.funnel} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="stage" width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Applications over time" empty={data.overTime.length === 0 && 'No data yet'}>
          <ResponsiveContainer>
            <BarChart data={data.overTime}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Applications" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={`Interview conversion (${conv.rate}%)`} empty={conv.applied === 0 && 'No data yet'}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={convData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} label>
                {convData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Skill gaps from your job matches" empty={data.topMissingSkills.length === 0 && 'Match a job description to see gaps'}>
          <ResponsiveContainer>
            <BarChart data={data.topMissingSkills} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip />
              <Bar dataKey="count" name="Jobs missing this" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Resume score history" empty={resumeHistory.length === 0 && 'Upload a resume to start'}>
          <ResponsiveContainer>
            <LineChart data={resumeHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="card">
          <h2 className="h2">Skills on your latest resume</h2>
          {data.skills.length === 0 ? (
            <div className="text-sm text-slate-400">Upload a resume to see detected skills.</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">{data.skills.map((s) => <Chip key={s} tone="blue">{s}</Chip>)}</div>
          )}
        </div>
      </div>
    </div>
  );
}

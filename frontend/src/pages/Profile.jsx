import { useState } from 'react';
import { ErrorBox } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name || '',
    targetRole: user.targetRole || '',
    skills: (user.skills || []).join(', '),
    education: user.education || '',
    experience: user.experience || '',
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const d = await api.updateProfile(form);
      setUser(d.user);
      flash('Profile saved');
    } catch (err) { setError(err.message); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.changePassword(pw);
      setPw({ currentPassword: '', newPassword: '' });
      flash('Password updated');
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="h1">Profile</h1>
      <ErrorBox message={error} />
      {msg && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</div>}

      <form onSubmit={save} className="card space-y-3">
        <div><label className="label">Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="label">Email</label><input className="input bg-slate-50" disabled value={user.email} /></div>
        <div><label className="label">Target role</label><input className="input" placeholder="e.g. AI Engineer" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} /></div>
        <div><label className="label">Skills (comma separated)</label><input className="input" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} /></div>
        <div><label className="label">Education</label><textarea className="input" rows={2} value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} /></div>
        <div><label className="label">Experience</label><textarea className="input" rows={3} value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} /></div>
        <button className="btn">Save profile</button>
      </form>

      <form onSubmit={changePw} className="card space-y-3">
        <h2 className="h2">Change password</h2>
        <div><label className="label">Current password</label><input className="input" type="password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
        <div><label className="label">New password</label><input className="input" type="password" minLength={6} required value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></div>
        <button className="btn">Update password</button>
      </form>
    </div>
  );
}

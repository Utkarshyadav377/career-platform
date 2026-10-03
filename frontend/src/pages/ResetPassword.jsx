import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { ErrorBox } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ResetPassword() {
  const { token } = useParams();
  const { completeReset } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await completeReset(token, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Choose a new password">
      <ErrorBox message={error} />
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">New password (min 6 characters)</label>
          <input className="input" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn w-full" disabled={busy}>{busy ? 'Saving…' : 'Set password & sign in'}</button>
      </form>
    </AuthShell>
  );
}

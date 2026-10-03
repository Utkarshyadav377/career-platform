import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { ErrorBox } from '../components/ui.jsx';
import { api } from '../services/api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      setResult(await api.forgotPassword(email));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll generate a reset link"
      footer={<Link className="text-brand-600 hover:underline" to="/login">Back to sign in</Link>}
    >
      <ErrorBox message={error} />
      {result ? (
        <div className="space-y-3 text-sm text-slate-600">
          <p>{result.message}</p>
          {result.devResetLink && (
            <p className="rounded-lg bg-amber-50 p-3 text-amber-800">
              Dev mode (no email provider configured):{' '}
              <a className="break-all underline" href={result.devResetLink}>open reset link</a>
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn w-full" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
        </form>
      )}
    </AuthShell>
  );
}

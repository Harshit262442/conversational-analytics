import { useState } from 'react';
import { login } from '../api/client';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const user = await login(username, password);
      onLogin(user);
    } catch (e) {
      setErr(e.response?.data?.error || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Analytics Login</h1>
        <p className="sub">Sign in to ask questions about production data.</p>
        {err && <div className="err">{err}</div>}
        <label>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={busy || !username || !password}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
        <div className="hint">
          Try <b>admin / admin123</b>, <b>alice / alice123</b>,
          <b> bob / bob123</b>, or <b>carol / carol123</b>.
        </div>
      </form>
    </div>
  );
}

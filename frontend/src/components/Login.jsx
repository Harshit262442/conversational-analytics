import { useEffect, useState } from 'react';
import { login, wakeBackend } from '../api/client';
import DataNetwork from './DataNetwork.jsx';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [serverStatus, setServerStatus] = useState('waking'); // 'waking' | 'ready'

  // Wake the backend the moment the page loads so login is instant
  useEffect(() => {
    const start = Date.now();
    wakeBackend().then(() => {
      setServerStatus('ready');
      const took = Date.now() - start;
      if (took > 4000) {
        // Took a while to wake — the user probably saw the banner
        console.log(`Backend awake after ${took}ms`);
      }
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const user = await login(username, password);
      onLogin(user);
    } catch (e) {
      if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
        setErr('The server is taking unusually long to wake up. Please try again in a moment.');
      } else {
        setErr(e.response?.data?.error || 'Login failed');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <DataNetwork density="low" tint="cool" />
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Analytics AI</h1>
        <p className="sub">Sign in to ask anything about your data.</p>

        {serverStatus === 'waking' && (
          <div className="server-status">
            <span className="status-spinner" />
            <span>
              <b>Connecting to server…</b>
              <small>First load can take ~30s on the free tier</small>
            </span>
          </div>
        )}

        {err && <div className="err">{err}</div>}

        <label>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <button disabled={busy || !username || !password}>
          {busy
            ? (serverStatus === 'waking' ? 'Waking server…' : 'Signing in…')
            : 'Sign in →'}
        </button>

        <div className="hint">
          Try <b>admin / admin123</b>, <b>alice / alice123</b>,
          <b> bob / bob123</b>, or <b>carol / carol123</b>.
        </div>
      </form>
    </div>
  );
}

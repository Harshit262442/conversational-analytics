import { useEffect, useRef, useState } from 'react';
import Login from './components/Login.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';
import ChatInput from './components/ChatInput.jsx';
import ChartRenderer from './components/ChartRenderer.jsx';
import DataTable from './components/DataTable.jsx';
import FeedbackButton from './components/FeedbackButton.jsx';
import ExportButton from './components/ExportButton.jsx';
import PngExportButton from './components/PngExportButton.jsx';
import {
  getHistory,
  runQuery,
  logout as apiLogout,
  setToken,
  setUnauthorizedHandler,
} from './api/client';

const SUGGESTIONS = [
  // Sales
  'Show total sales by day for the last 30 days',
  'Top 5 customers by total revenue',
  'How many invoices are overdue?',
  // HR
  'List employees currently on leave',
  'Average salary by department',
  'Attendance summary for the last week',
  // Inventory
  'Which products are below their reorder level?',
  'Stock quantity by warehouse',
  'Stock movements in the last 7 days',
  // Purchase
  'Total purchase value by supplier this month',
  'List pending purchase orders',
  // Manufacturing
  'Daily production trend for the last 15 days',
  'Which defect type is most common?',
];

const STORAGE_KEY = 'cad_user';

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
    catch { return null; }
  });
  const [history, setHistory] = useState([]);
  const [current, setCurrent] = useState(null); // latest answer
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errorSql, setErrorSql] = useState('');
  const chartRef = useRef(null);

  useEffect(() => {
    // If backend returns 401 (expired session / restart), force a sign-out
    setUnauthorizedHandler(() => {
      setToken(null);
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setCurrent(null);
      setHistory([]);
    });
  }, []);

  useEffect(() => {
    if (user) refreshHistory();
  }, [user]);

  function refreshHistory() {
    getHistory()
      .then((d) => setHistory(d.history || []))
      .catch(() => {});
  }

  async function handleAsk(question) {
    setBusy(true); setError(''); setErrorSql('');
    try {
      const res = await runQuery(question);
      if (res.error) {
        setError(res.error);
        setErrorSql(res.sql || '');
        setCurrent(null);
      } else {
        setCurrent({ question, ...res });
      }
      refreshHistory();
    } catch (e) {
      const data = e.response?.data || {};
      setError(data.error || 'Request failed. Is the backend running?');
      setErrorSql(data.sql || '');
    } finally {
      setBusy(false);
    }
  }

  function pickFromHistory(h) {
    // Re-run the original question so we get a fresh chart from the recorded SQL
    handleAsk(h.question);
  }

  function logout() {
    apiLogout();
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    setUser(null); setCurrent(null); setHistory([]);
  }

  function handleLogin(u) {
    // server returns { username, department, token } — keep token separate
    setToken(u.token);
    const userInfo = { username: u.username, department: u.department };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo));
    setUser(userInfo);
  }

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="app">
      <HistoryPanel
        items={history}
        activeId={current?.query_id}
        onPick={pickFromHistory}
        user={user}
      />
      <main className="main">
        <header>
          <div>
            <h1>Conversational Analytics</h1>
            <div className="subtitle">Ask anything about your business data</div>
          </div>
          <button className="logout" onClick={logout}>Sign out</button>
        </header>

        <div className="results-area">
          {error && (
            <div className="error-banner">
              <div>{error}</div>
              {errorSql && (
                <pre className="error-sql">{errorSql}</pre>
              )}
            </div>
          )}

          {!current && !error && (
            <div className="empty-state">
              <div className="orb">💬</div>
              <h2>How can I help you today?</h2>
              <p>Ask in plain English — I'll write the SQL, run it, and chart the result.</p>
              <div className="suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => handleAsk(s)} disabled={busy}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {current && (
            <div className="result-card">
              <div className="q-line">
                <span className="q-badge">Q</span>
                <span>{current.question}</span>
              </div>
              <div className="sql-line">{current.sql}</div>
              <div ref={chartRef}>
                {current.rows?.length > 0 ? (
                  <>
                    <ChartRenderer
                      columns={current.columns}
                      rows={current.rows}
                      chartType={current.chart_type}
                    />
                    <DataTable columns={current.columns} rows={current.rows} />
                  </>
                ) : (
                  <div className="empty-result">
                    <div className="empty-result-icon">📭</div>
                    <h3>No matching records</h3>
                    <p>
                      The query ran successfully but returned <b>0 rows</b>.
                      Try widening the time range (e.g. "last 30 days" instead of
                      "today") or rephrasing the question.
                    </p>
                  </div>
                )}
              </div>
              <div className="toolbar">
                <ExportButton queryId={current.query_id} />
                <PngExportButton targetRef={chartRef} queryId={current.query_id} />
                <FeedbackButton queryId={current.query_id} />
              </div>
            </div>
          )}
        </div>

        <ChatInput onSend={handleAsk} busy={busy} />
      </main>
    </div>
  );
}

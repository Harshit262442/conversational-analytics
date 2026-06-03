import { useEffect, useRef, useState } from 'react';
import Login from './components/Login.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';
import ChatInput from './components/ChatInput.jsx';
import ChartRenderer from './components/ChartRenderer.jsx';
import DataTable from './components/DataTable.jsx';
import FeedbackButton from './components/FeedbackButton.jsx';
import ExportButton from './components/ExportButton.jsx';
import PngExportButton from './components/PngExportButton.jsx';
import ThinkingIndicator from './components/ThinkingIndicator.jsx';
import ToastContainer, { useToasts } from './components/Toast.jsx';
import DataNetwork from './components/DataNetwork.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import SqlHighlight from './components/SqlHighlight.jsx';
import SchemaExplorer from './components/SchemaExplorer.jsx';
import InsightsCard from './components/InsightsCard.jsx';
import WelcomeDashboard from './components/WelcomeDashboard.jsx';
import FollowUps from './components/FollowUps.jsx';
import {
  getHistory,
  runQuery,
  getInsights,
  getFollowups,
  logout as apiLogout,
  setToken,
  setUnauthorizedHandler,
} from './api/client';

const SUGGESTIONS = [
  'Show total sales by day for the last 30 days',
  'Top 5 customers by total revenue',
  'How many invoices are overdue?',
  'List employees currently on leave',
  'Average salary by department',
  'Which products are below their reorder level?',
  'Stock movements in the last 7 days',
  'Total purchase value by supplier this month',
  'Daily production trend for the last 15 days',
  'Which defect type is most common?',
];

const STORAGE_KEY = 'cad_user';

function hasRealData(rows) {
  if (!rows?.length) return false;
  return rows.some(row => row.some(v => v !== null && v !== undefined));
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
    catch { return null; }
  });
  const [history, setHistory] = useState([]);
  const [current, setCurrent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errorSql, setErrorSql] = useState('');
  const [sparkle, setSparkle] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [followups, setFollowups] = useState([]);
  const chartRef = useRef(null);
  const cardRef  = useRef(null);
  const { toasts, push: pushToast } = useToasts();

  // Global Ctrl/Cmd+K shortcut to open the command palette
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
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

  // After every successful result, fire insights + follow-ups in parallel.
  // Both are best-effort: if Gemini fails or has nothing to say, sections hide.
  useEffect(() => {
    if (!current || !hasRealData(current.rows)) {
      setInsights([]); setFollowups([]); setInsightsLoading(false); return;
    }
    setInsightsLoading(true);
    let cancelled = false;
    const payload = {
      question: current.question,
      columns:  current.columns,
      rows:     current.rows,
    };
    Promise.allSettled([getInsights(payload), getFollowups(payload)])
      .then(([insightsRes, followupsRes]) => {
        if (cancelled) return;
        setInsights(insightsRes.status === 'fulfilled'  ? insightsRes.value.insights  || [] : []);
        setFollowups(followupsRes.status === 'fulfilled' ? followupsRes.value.followups || [] : []);
      })
      .finally(() => { if (!cancelled) setInsightsLoading(false); });
    return () => { cancelled = true; };
  }, [current?.query_id]);

  function refreshHistory() {
    getHistory()
      .then((d) => setHistory(d.history || []))
      .catch(() => {});
  }

  async function handleAsk(question) {
    setBusy(true); setError(''); setErrorSql('');
    try {
      const res = await runQuery(question, user);
      if (res.error) {
        setError(res.error);
        setErrorSql(res.sql || '');
        setCurrent(null);
      } else {
        setCurrent({ question, ...res });
        setSparkle((n) => n + 1);
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
    handleAsk(h.question);
  }

  function logout() {
    apiLogout();
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    setUser(null); setCurrent(null); setHistory([]);
    pushToast('Signed out', 'info');
  }

  function handleLogin(u) {
    setToken(u.token);
    const userInfo = { username: u.username, department: u.department };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo));
    setUser(userInfo);
    pushToast(`Welcome back, ${u.username}!`, 'success');
  }

  // 3D tilt for the result card following the mouse
  function handleCardMove(e) {
    const el = cardRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    el.style.setProperty('--rx', `${(-y * 1.2).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${( x * 1.2).toFixed(2)}deg`);
  }
  function handleCardLeave() {
    const el = cardRef.current; if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }

  if (!user) return (
    <>
      <Login onLogin={handleLogin} />
      <ToastContainer toasts={toasts} />
    </>
  );

  return (
    <div className="app">
      <HistoryPanel
        items={history}
        activeId={current?.query_id}
        onPick={pickFromHistory}
        user={user}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />
      <main className="main">
        <header>
          <div>
            <h1>Conversational Analytics</h1>
            <div className="subtitle">Ask anything about your business data</div>
          </div>
          <div className="header-actions">
            <button
              className="schema-trigger"
              onClick={() => setSchemaOpen(true)}
              title="See what you can ask"
            >
              <span>📚</span> What can I ask?
            </button>
            <button className="logout" onClick={logout}>Sign out</button>
          </div>
        </header>

        <div className="results-area">
          {error && (
            <div className="error-banner">
              <div>{error}</div>
              {errorSql && (<pre className="error-sql">{errorSql}</pre>)}
            </div>
          )}

          {busy && !current && <ThinkingIndicator />}

          {!current && !error && !busy && (
            <div className="welcome-area">
              <WelcomeDashboard user={user} onExplore={handleAsk} />
              <div className="welcome-divider">
                <span>Or ask anything in plain English</span>
              </div>
              <div className="suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => handleAsk(s)}
                    disabled={busy}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {current && (
            <div
              className="result-card"
              ref={cardRef}
              onMouseMove={handleCardMove}
              onMouseLeave={handleCardLeave}
              key={current.query_id}
            >
              <header className="result-header">
                <div className="q-line">
                  <span className="q-badge">Q</span>
                  <span>{current.question}</span>
                </div>
                {current.sql && (
                  <button
                    className="sql-toggle"
                    onClick={() => setShowSql((s) => !s)}
                    title={showSql ? 'Hide SQL' : 'View SQL'}
                  >
                    {showSql ? '◂ Hide SQL' : 'View SQL ▸'}
                  </button>
                )}
              </header>

              {showSql && current.sql && (
                <div className="sql-line">
                  <SqlHighlight sql={current.sql} />
                </div>
              )}

              <div ref={chartRef} className="result-body">
                {hasRealData(current.rows) ? (
                  <>
                    <ChartRenderer
                      columns={current.columns}
                      rows={current.rows}
                      chartType={current.chart_type}
                    />
                    <InsightsCard insights={insights} />
                    <DataTable columns={current.columns} rows={current.rows} />
                    <FollowUps items={followups} onPick={handleAsk} />
                  </>
                ) : (
                  <div className="empty-result">
                    <div className="empty-result-icon">📭</div>
                    <h3>No data available</h3>
                    <p>
                      {current.reason === 'off_topic'
                        ? "That question doesn't map to any of the available tables (Manufacturing, HR, Inventory, Sales, Purchase). Try rephrasing it around those topics."
                        : "The query ran successfully but returned 0 rows. Try widening the time range or rephrasing the question."}
                    </p>
                  </div>
                )}
              </div>

              {current.sql && (
                <footer className="result-footer">
                  <div className="result-meta">
                    {current.rows?.length ?? 0} {current.rows?.length === 1 ? 'row' : 'rows'}
                  </div>
                  <div className="toolbar">
                    <ExportButton queryId={current.query_id} onExport={() => pushToast('CSV downloading…', 'success')} />
                    <PngExportButton targetRef={chartRef} queryId={current.query_id} onExport={() => pushToast('PNG saved', 'success')} />
                    <FeedbackButton queryId={current.query_id} onFlag={() => pushToast('Thanks — flagged as wrong', 'info')} />
                  </div>
                </footer>
              )}
            </div>
          )}
        </div>

        <ChatInput
          onSend={handleAsk}
          busy={busy}
          onOpenPalette={() => setPaletteOpen(true)}
        />
      </main>
      <ToastContainer toasts={toasts} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        suggestions={SUGGESTIONS}
        history={history}
        onPick={(q) => handleAsk(q)}
      />
      <SchemaExplorer
        open={schemaOpen}
        onClose={() => setSchemaOpen(false)}
        onPickQuestion={(q) => handleAsk(q)}
      />
    </div>
  );
}

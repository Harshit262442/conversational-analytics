function iconFor(chartHint) {
  if (chartHint === 'metric') return '🔢';
  if (chartHint === 'line') return '📈';
  if (chartHint === 'bar') return '📊';
  return '💬';
}

export default function HistoryPanel({ items, activeId, onPick, user }) {
  return (
    <aside className="sidebar">
      <header>
        <div className="brand">
          <div className="brand-logo">✨</div>
          <span className="brand-text">Analytics AI</span>
        </div>
        <div className="user-pill">
          <span className="dot" />
          {user?.username} · {user?.department}
        </div>
      </header>
      <div className="history-section-title">Recent questions</div>
      <div className="history-list">
        {items.length === 0 && (
          <div className="history-empty">
            No questions yet. Ask one to get started.
          </div>
        )}
        {items.map((h) => (
          <div
            key={h.id}
            className={`history-item ${activeId === h.id ? 'active' : ''}`}
            onClick={() => onPick(h)}
          >
            <span className="icon">{iconFor(h.chart_type)}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="q">{h.question}</div>
              <div className="meta">
                {h.row_count} rows · {h.username || 'anon'}
                {!h.was_correct && ' · flagged'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

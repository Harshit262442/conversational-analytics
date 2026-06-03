// Renders AI-generated insights — only mounts when there's something to say.
export default function InsightsCard({ insights }) {
  if (!insights?.length) return null;
  return (
    <div className="insights-card">
      <div className="insights-head">
        <span className="insights-badge">✨ AI Insight{insights.length > 1 ? 's' : ''}</span>
      </div>
      <ul className="insights-list">
        {insights.map((t, i) => (
          <li key={i} style={{ animationDelay: `${i * 90}ms` }}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

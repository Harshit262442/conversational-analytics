export default function FollowUps({ items, onPick }) {
  if (!items?.length) return null;
  return (
    <div className="followups-card">
      <div className="followups-head">
        <span className="followups-badge">💡 Try asking next</span>
      </div>
      <div className="followups-list">
        {items.map((q, i) => (
          <button
            key={`${i}-${q}`}
            className="followup-chip"
            onClick={() => onPick(q)}
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span className="followup-text">{q}</span>
            <span className="followup-arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

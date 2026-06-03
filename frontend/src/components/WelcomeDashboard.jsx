import { useEffect, useState } from 'react';
import { getDashboard } from '../api/client';
import AnimatedCounter from './AnimatedCounter.jsx';

function greet() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function WelcomeDashboard({ user, onExplore }) {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getDashboard()
      .then(d => setMetrics(d.metrics || []))
      .catch(() => setError(true));
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-head">
        <h2>{greet()}{user?.username ? `, ${user.username}` : ''}</h2>
        <p>Here's a snapshot of what's happening across the business.</p>
      </div>

      <div className="kpi-grid">
        {metrics === null && !error && [0, 1, 2, 3].map(i => (
          <div key={i} className="kpi-tile skeleton" />
        ))}
        {metrics && metrics.map(m => (
          <button
            key={m.id}
            className={`kpi-tile color-${m.color}`}
            onClick={() => onExplore?.(m.explore)}
            title={`Explore: ${m.explore}`}
          >
            <div className="kpi-top">
              <span className="kpi-icon">{m.icon}</span>
              {m.trend !== null && m.trend !== undefined && (
                <span className={`kpi-trend ${m.trend >= 0 ? 'up' : 'down'}`}>
                  {m.trend >= 0 ? '▲' : '▼'} {Math.abs(m.trend).toFixed(1)}%
                </span>
              )}
            </div>

            <div className="kpi-value">
              {m.format === 'currency' && <span className="kpi-prefix">₹</span>}
              <AnimatedCounter value={Math.round(m.value)} />
              {m.unit && <span className="kpi-unit"> {m.unit}</span>}
            </div>

            <div className="kpi-title">{m.title}</div>
            {m.trend_label && (
              <div className="kpi-trend-label">{m.trend_label}</div>
            )}
            <div className="kpi-explore">View details →</div>
          </button>
        ))}
      </div>
    </div>
  );
}

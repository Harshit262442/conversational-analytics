import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';
import AnimatedCounter from './AnimatedCounter.jsx';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
const GRID_STROKE  = 'rgba(255,255,255,0.08)';
const AXIS_COLOR   = '#a3a8c3';
const TOOLTIP_BG   = 'rgba(13,17,48,0.95)';
const TOOLTIP_BORDER = 'rgba(255,255,255,0.12)';

const tooltipStyle = {
  backgroundColor: TOOLTIP_BG,
  border: `1px solid ${TOOLTIP_BORDER}`,
  borderRadius: 10,
  color: '#f5f7ff',
  fontSize: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
};

function rowsToObjects(columns, rows) {
  return rows.map((r) => {
    const o = {};
    columns.forEach((c, i) => (o[c] = r[i]));
    return o;
  });
}

export default function ChartRenderer({ columns, rows, chartType }) {
  if (!columns?.length || !rows?.length) return null;

  if (chartType === 'metric') {
    return (
      <div className="metric-big">
        <div className="num"><AnimatedCounter value={rows[0][0]} /></div>
        <div className="lbl">{columns[0]}</div>
      </div>
    );
  }

  if (chartType === 'table') return null;

  const data = rowsToObjects(columns, rows);
  const xKey = columns[0];
  const yKeys = columns.slice(1);

  const commonAxis = {
    stroke: AXIS_COLOR,
    fontSize: 11,
    tick: { fill: AXIS_COLOR },
  };

  if (chartType === 'line') {
    return (
      <div className="chart-wrap">
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey={xKey} {...commonAxis} />
              <YAxis {...commonAxis} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeOpacity: 0.4 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: AXIS_COLOR }} />
              {yKeys.map((k, i) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  animationDuration={800}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // bar
  return (
    <div className="chart-wrap">
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
            <defs>
              {COLORS.map((c, i) => (
                <linearGradient key={i} id={`bar-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c} stopOpacity={1} />
                  <stop offset="100%" stopColor={c} stopOpacity={0.5} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey={xKey} {...commonAxis} />
            <YAxis {...commonAxis} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
            <Legend wrapperStyle={{ fontSize: 12, color: AXIS_COLOR }} />
            {yKeys.map((k, i) => (
              <Bar
                key={k}
                dataKey={k}
                fill={`url(#bar-${i % COLORS.length})`}
                radius={[6, 6, 0, 0]}
                animationDuration={800}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

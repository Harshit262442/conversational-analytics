export default function DataTable({ columns, rows }) {
  if (!columns?.length || !rows?.length) return null;
  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((c) => <th key={c}>{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((v, j) => <td key={j}>{v === null ? '—' : String(v)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

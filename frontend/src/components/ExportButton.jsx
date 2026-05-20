import { csvUrl } from '../api/client';

export default function ExportButton({ queryId }) {
  if (!queryId) return null;
  return (
    <a href={csvUrl(queryId)} target="_blank" rel="noreferrer">
      <button>⬇️ Export CSV</button>
    </a>
  );
}

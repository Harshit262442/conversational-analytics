import { csvUrl } from '../api/client';

export default function ExportButton({ queryId, onExport }) {
  if (!queryId) return null;
  return (
    <a href={csvUrl(queryId)} target="_blank" rel="noreferrer" onClick={onExport}>
      <button>⬇️ Export CSV</button>
    </a>
  );
}

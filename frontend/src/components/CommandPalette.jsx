import { useEffect, useMemo, useRef, useState } from 'react';

export default function CommandPalette({ open, onClose, suggestions, history, onPick }) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ(''); setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const items = useMemo(() => {
    const seen = new Set();
    const all = [
      ...(history || []).map(h => ({ kind: 'history', text: h.question, meta: `${h.row_count} rows` })),
      ...(suggestions || []).map(s => ({ kind: 'suggestion', text: s, meta: 'Suggested' })),
    ].filter(it => {
      if (seen.has(it.text)) return false;
      seen.add(it.text); return true;
    });
    const needle = q.trim().toLowerCase();
    if (!needle) return all.slice(0, 12);
    return all
      .map(it => ({ ...it, score: fuzzyScore(it.text.toLowerCase(), needle) }))
      .filter(it => it.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [q, suggestions, history]);

  useEffect(() => { setIdx(0); }, [q]);

  function handleKey(e) {
    if (e.key === 'Escape')   { onClose(); }
    if (e.key === 'ArrowDown'){ e.preventDefault(); setIdx(i => Math.min(items.length - 1, i + 1)); }
    if (e.key === 'ArrowUp')  { e.preventDefault(); setIdx(i => Math.max(0, i - 1)); }
    if (e.key === 'Enter')    { e.preventDefault(); if (items[idx]) { onPick(items[idx].text); onClose(); } }
  }

  if (!open) return null;

  return (
    <div className="cmdk-overlay" onClick={onClose}>
      <div className="cmdk" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input-row">
          <span className="cmdk-icon">⌘</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search past questions or pick a suggestion…"
          />
          <kbd>ESC</kbd>
        </div>
        <div className="cmdk-list">
          {items.length === 0 && (
            <div className="cmdk-empty">No matches. Press Enter to ask anyway:
              <div style={{ marginTop: 8, color: '#c4b5fd' }}>{q || '—'}</div>
            </div>
          )}
          {items.map((it, i) => (
            <div
              key={`${it.kind}-${i}-${it.text}`}
              className={`cmdk-item ${i === idx ? 'active' : ''}`}
              onMouseEnter={() => setIdx(i)}
              onClick={() => { onPick(it.text); onClose(); }}
            >
              <span className="cmdk-kind">
                {it.kind === 'history' ? '🕘' : '✨'}
              </span>
              <span className="cmdk-text">{it.text}</span>
              <span className="cmdk-meta">{it.meta}</span>
            </div>
          ))}
        </div>
        <div className="cmdk-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

// Tiny fuzzy scorer: rewards consecutive char matches
function fuzzyScore(text, needle) {
  let score = 0, idx = 0;
  for (const ch of needle) {
    const found = text.indexOf(ch, idx);
    if (found === -1) return 0;
    score += (found === idx ? 4 : 1);
    idx = found + 1;
  }
  if (text.includes(needle)) score += 20;
  if (text.startsWith(needle)) score += 30;
  return score;
}

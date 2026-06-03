import { useEffect, useState } from 'react';

// Reveals `text` one character at a time. Resets when text changes.
export default function TypewriterText({ text, speed = 8, className }) {
  const [shown, setShown] = useState('');

  useEffect(() => {
    if (!text) { setShown(''); return; }
    setShown('');
    let i = 0;
    const id = setInterval(() => {
      i += 4;                 // 4 chars per tick for snappy reveal on long SQL
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return <span className={className}>{shown}<span className="caret">▍</span></span>;
}

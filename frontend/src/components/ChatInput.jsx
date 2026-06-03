import { useState } from 'react';
import BurstEffect from './BurstEffect.jsx';

export default function ChatInput({ onSend, busy, onOpenPalette }) {
  const [text, setText] = useState('');
  const [burst, setBurst] = useState(0);

  function submit(e) {
    e.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    setBurst(b => b + 1);
    onSend(q);
    setText('');
  }

  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);

  return (
    <form className="chat-input" onSubmit={submit}>
      <div className="chat-input-wrap">
        <input
          placeholder="Ask about sales, employees, inventory, defects, machines..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
        />
        <button
          type="button"
          className="kbd-hint"
          onClick={onOpenPalette}
          title="Open command palette"
        >
          <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd><kbd>K</kbd>
        </button>
      </div>
      <div className="send-wrap">
        <BurstEffect trigger={burst} />
        <button disabled={busy || !text.trim()}>
          {busy
            ? <span className="dots"><span /><span /><span /></span>
            : 'Send →'}
        </button>
      </div>
    </form>
  );
}

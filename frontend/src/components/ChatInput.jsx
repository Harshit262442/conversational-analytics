import { useState } from 'react';

export default function ChatInput({ onSend, busy }) {
  const [text, setText] = useState('');

  function submit(e) {
    e.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    onSend(q);
    setText('');
  }

  return (
    <form className="chat-input" onSubmit={submit}>
      <input
        placeholder="Ask about production, defects, machines, shifts, suppliers..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={busy}
      />
      <button disabled={busy || !text.trim()}>
        {busy
          ? <span className="dots"><span /><span /><span /></span>
          : 'Send →'}
      </button>
    </form>
  );
}

import { useState } from 'react';
import { sendFeedback } from '../api/client';

export default function FeedbackButton({ queryId, onFlag }) {
  const [sent, setSent] = useState(false);
  if (!queryId) return null;

  async function flag() {
    if (sent) return;
    try {
      await sendFeedback(queryId);
      setSent(true);
      if (onFlag) onFlag();
    } catch {/* best effort */}
  }
  return (
    <button className="bad" onClick={flag} disabled={sent}>
      {sent ? '👎 Marked wrong' : '👎 Wrong answer'}
    </button>
  );
}

import { useState } from 'react';
import { sendFeedback } from '../api/client';

export default function FeedbackButton({ queryId }) {
  const [sent, setSent] = useState(false);
  if (!queryId) return null;

  async function flag() {
    if (sent) return;
    try {
      await sendFeedback(queryId);
      setSent(true);
    } catch {
      /* swallow — feedback is best-effort */
    }
  }
  return (
    <button className="bad" onClick={flag} disabled={sent}>
      {sent ? '👎 Marked wrong' : '👎 Wrong answer'}
    </button>
  );
}

import { useEffect, useState } from 'react';

// Counts from 0 up to `value` smoothly over `duration` ms.
// Falls back to plain rendering if value isn't numeric.
export default function AnimatedCounter({ value, duration = 1100 }) {
  const target = Number(value);
  const isNum = Number.isFinite(target);
  const [n, setN] = useState(isNum ? 0 : value);

  useEffect(() => {
    if (!isNum) { setN(value); return; }
    const start = performance.now();
    let raf;
    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setN(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
      else setN(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  if (!isNum) return <>{value}</>;
  const isInt = Number.isInteger(target);
  return <>{isInt ? Math.round(n).toLocaleString() : n.toFixed(2)}</>;
}

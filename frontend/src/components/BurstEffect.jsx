import { useEffect, useRef } from 'react';

/**
 * Plays a small particle burst centered on the canvas.
 * Remount the component to re-trigger.
 */
export default function BurstEffect({ trigger }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = w / 2, cy = h / 2;
    const N = 26;
    const particles = Array.from({ length: N }, (_, i) => {
      const a = (i / N) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 3 + Math.random() * 3;
      return {
        x: cx, y: cy,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        r: 2 + Math.random() * 2,
        life: 1,
        color: ['139,92,246','59,130,246','236,72,153'][i % 3],
      };
    });

    let raf;
    function tick() {
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      for (const p of particles) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.94; p.vy *= 0.94;
        p.life -= 0.025;
        ctx.fillStyle = `rgba(${p.color}, ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      if (alive) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [trigger]);

  return <canvas ref={ref} className="burst-canvas" />;
}

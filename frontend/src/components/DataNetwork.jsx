import { useEffect, useRef } from 'react';

/**
 * A canvas-based "living data network".
 *  - Glowing particle nodes drift and gently attract to the mouse
 *  - Nearby nodes connect with faint gradient lines
 *  - Random ripple pulses periodically expand outward
 *  - Pure canvas, no dependencies, runs at 60fps
 *
 * Props:
 *  - density: 'low' | 'normal' | 'high'   (number of nodes)
 *  - tint:    'cool' | 'warm' | 'rainbow' (color palette)
 *  - interactive: react to mouse (default true)
 */
export default function DataNetwork({
  density = 'normal',
  tint = 'rainbow',
  interactive = true,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const PALETTE = tint === 'cool'
      ? ['139,92,246', '59,130,246']
      : tint === 'warm'
        ? ['236,72,153', '251,146,60']
        : ['139,92,246', '59,130,246'];   // default also cool — drop the pink

    const COUNT =
      density === 'minimal' ? 38 :
      density === 'low'     ? 60 :
      density === 'high'    ? 140 :
                              90;
    const CONNECT = density === 'minimal' ? 110 : 130;
    const LINE_OPACITY = density === 'minimal' ? 0.10 : 0.16;
    const PULSE_INTERVAL = density === 'minimal' ? 5000 : 3800;

    let w = 0, h = 0;
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    // ---- particles ----
    const nodes = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.6,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      pulse: Math.random() * Math.PI * 2,
    }));

    // ---- mouse ----
    const mouse = { x: -9999, y: -9999, active: false };
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onLeave = () => { mouse.active = false; mouse.x = -9999; mouse.y = -9999; };
    if (interactive) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseleave', onLeave);
    }
    window.addEventListener('resize', resize);

    // ---- random ripple pulses (kept rare for elegance) ----
    const pulses = [];
    const pulseTimer = setInterval(() => {
      // Skip half the pulses randomly so they feel less frequent
      if (Math.random() < 0.6) return;
      pulses.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0,
        life: 1,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      });
    }, PULSE_INTERVAL);

    // ---- main loop ----
    function tick(t) {
      ctx.clearRect(0, 0, w, h);

      // Move nodes
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        n.x = Math.max(0, Math.min(w, n.x));
        n.y = Math.max(0, Math.min(h, n.y));
        n.pulse += 0.04;

        // mouse attraction + size pump
        if (mouse.active) {
          const dx = mouse.x - n.x, dy = mouse.y - n.y;
          const d2 = dx*dx + dy*dy;
          if (d2 < 22500) {     // 150px radius
            const d = Math.sqrt(d2);
            const f = (1 - d / 150) * 0.06;
            n.vx += (dx / d) * f;
            n.vy += (dy / d) * f;
          }
        }
        // damping + tiny ambient jitter
        n.vx = n.vx * 0.985 + (Math.random() - 0.5) * 0.01;
        n.vy = n.vy * 0.985 + (Math.random() - 0.5) * 0.01;
      }

      // Connections
      ctx.lineWidth = 0.6;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx*dx + dy*dy;
          if (d2 < CONNECT * CONNECT) {
            const d = Math.sqrt(d2);
            const op = (1 - d / CONNECT) * LINE_OPACITY;
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grad.addColorStop(0, `rgba(${a.color}, ${op})`);
            grad.addColorStop(1, `rgba(${b.color}, ${op})`);
            ctx.strokeStyle = grad;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Nodes — subtle glow only, no over-bright halo
      for (const n of nodes) {
        const breathe = 1 + Math.sin(n.pulse) * 0.15;
        const r = n.r * breathe;
        // soft outer glow (much dimmer)
        ctx.fillStyle = `rgba(${n.color}, 0.08)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 3.5, 0, Math.PI * 2);
        ctx.fill();
        // inner core
        ctx.fillStyle = `rgba(255, 255, 255, 0.7)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 0.85, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ripple pulses — fainter, slower
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.r += 1.1;
        p.life -= 0.011;
        if (p.life <= 0) { pulses.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(${p.color}, ${p.life * 0.22})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(tick);
    }
    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(pulseTimer);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', resize);
    };
  }, [density, tint, interactive]);

  return <canvas ref={ref} className="data-network" aria-hidden="true" />;
}

import React, { useEffect, useRef, useState } from 'react';

interface RadarCanvasProps {
  compact?: boolean;
  showSweep?: boolean;
  onPick?: (cs: string) => void;
  mode?: 'full' | 'static';
  highlight?: string;
}

interface Drone {
  cs: string; x: number; y: number; vx: number; vy: number;
  alt: number; spd: number; role: string; own?: boolean;
  trail: { x: number; y: number }[];
}

export function RadarCanvas({ compact = false, showSweep = true, onPick, mode = 'full', highlight }: RadarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dronesRef = useRef<Drone[]>([]);
  const sweepRef = useRef(0);
  const tickRef = useRef(0);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const swarm: Drone[] = [
      { cs: 'AERO-07', x:  0.20, y:  0.30, vx:  0.0006, vy:  0.0004, alt: 124, spd: 14, role: 'survey',  own: true, trail: [] },
      { cs: 'AERO-12', x: -0.40, y:  0.10, vx:  0.0009, vy: -0.0003, alt:  96, spd: 11, role: 'patrol',           trail: [] },
      { cs: 'AERO-04', x:  0.55, y: -0.25, vx: -0.0005, vy:  0.0005, alt: 168, spd: 18, role: 'mapping',          trail: [] },
      { cs: 'AERO-19', x: -0.15, y: -0.55, vx:  0.0004, vy:  0.0006, alt: 112, spd: 13, role: 'patrol',           trail: [] },
      { cs: 'AERO-23', x:  0.65, y:  0.45, vx: -0.0007, vy: -0.0004, alt: 144, spd: 16, role: 'relay',            trail: [] },
      { cs: 'AERO-31', x: -0.55, y: -0.20, vx:  0.0003, vy: -0.0005, alt:  88, spd:  9, role: 'survey',           trail: [] },
    ];
    dronesRef.current = swarm;
  }, []);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    let raf: number;

    const resize = () => {
      const r = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      c.width = r.width * dpr; c.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);

    const loop = () => {
      const r = c.getBoundingClientRect();
      const W = r.width, H = r.height;
      const cx = W / 2, cy = H / 2;
      const R = Math.min(W, H) * (compact ? 0.45 : 0.46);
      tickRef.current += 1;

      ctx.clearRect(0, 0, W, H);

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.4);
      grad.addColorStop(0, 'rgba(163,197,133,0.06)');
      grad.addColorStop(0.7, 'rgba(163,197,133,0.015)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(163,197,133,0.10)'; ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath(); ctx.arc(cx, cy, (R * i) / 4, 0, Math.PI * 2); ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(163,197,133,0.08)';
      ctx.beginPath();
      ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
      ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
      ctx.stroke();

      if (!compact) {
        ctx.fillStyle = 'rgba(154,163,184,0.45)';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center'; ctx.fillText('N · 000', cx, cy - R - 8);
        ctx.fillText('S · 180', cx, cy + R + 16);
        ctx.textAlign = 'left'; ctx.fillText('E · 090', cx + R + 8, cy + 4);
        ctx.textAlign = 'right'; ctx.fillText('W · 270', cx - R - 8, cy + 4);
      }

      if (showSweep) {
        sweepRef.current = (sweepRef.current + 0.012) % (Math.PI * 2);
        const sw = sweepRef.current;
        const sweepGrad = ctx.createConicGradient(sw - Math.PI / 2, cx, cy);
        sweepGrad.addColorStop(0, 'rgba(163,197,133,0)');
        sweepGrad.addColorStop(0.05, 'rgba(163,197,133,0.30)');
        sweepGrad.addColorStop(0.18, 'rgba(163,197,133,0)');
        sweepGrad.addColorStop(1, 'rgba(163,197,133,0)');
        ctx.fillStyle = sweepGrad;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(163,197,133,0.55)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(sw) * R, cy + Math.sin(sw) * R); ctx.stroke();
      }

      const drones = dronesRef.current;
      drones.forEach(d => {
        if (mode === 'static') return;
        d.x += d.vx; d.y += d.vy;
        const dist = Math.sqrt(d.x * d.x + d.y * d.y);
        if (dist > 0.85) {
          const nx = d.x / dist, ny = d.y / dist;
          const dot = d.vx * nx + d.vy * ny;
          d.vx -= 2 * dot * nx; d.vy -= 2 * dot * ny;
        }
        d.vx += (Math.random() - 0.5) * 0.00004;
        d.vy += (Math.random() - 0.5) * 0.00004;
        d.trail.push({ x: d.x, y: d.y });
        if (d.trail.length > 60) d.trail.shift();
      });

      drones.forEach(d => {
        ctx.lineWidth = 1.2;
        for (let i = 1; i < d.trail.length; i++) {
          const a = d.trail[i - 1], b = d.trail[i];
          const op = (i / d.trail.length) * (d.own ? 0.55 : 0.30);
          ctx.strokeStyle = d.own ? `rgba(163,197,133,${op})` : `rgba(154,163,184,${op})`;
          ctx.beginPath();
          ctx.moveTo(cx + a.x * R, cy + a.y * R);
          ctx.lineTo(cx + b.x * R, cy + b.y * R); ctx.stroke();
        }
      });

      drones.forEach(d => {
        const px = cx + d.x * R, py = cy + d.y * R;
        const isOwn = d.own ?? false;
        const isHover = hover === d.cs;
        const ringR = isOwn ? 8 : 5;
        ctx.beginPath(); ctx.arc(px, py, ringR, 0, Math.PI * 2);
        ctx.fillStyle = isOwn ? '#a3c585' : '#9aa3b8'; ctx.fill();
        if (isOwn) {
          const pulse = (Math.sin(tickRef.current * 0.06) + 1) / 2;
          ctx.beginPath(); ctx.arc(px, py, 8 + pulse * 14, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(163,197,133,${0.5 - pulse * 0.45})`; ctx.lineWidth = 1.5; ctx.stroke();
        }
        const ang = Math.atan2(d.vy, d.vx);
        ctx.strokeStyle = isOwn ? 'rgba(163,197,133,0.9)' : 'rgba(154,163,184,0.7)';
        ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(ang) * 14, py + Math.sin(ang) * 14); ctx.stroke();

        if (!compact || isOwn || isHover) {
          ctx.fillStyle = isOwn ? '#a3c585' : 'rgba(230,235,245,0.85)';
          ctx.font = isOwn ? 'bold 10px JetBrains Mono' : '10px JetBrains Mono';
          ctx.textAlign = 'left'; ctx.fillText(d.cs, px + 12, py - 4);
          if (!compact) {
            ctx.fillStyle = 'rgba(154,163,184,0.7)';
            ctx.font = '9px JetBrains Mono';
            ctx.fillText(`${d.alt}m · ${d.spd}m/s`, px + 12, py + 8);
          }
        }
      });

      if (highlight) {
        const t = drones.find(d => d.cs === highlight);
        if (t) {
          const px = cx + t.x * R, py = cy + t.y * R;
          ctx.strokeStyle = 'rgba(163,197,133,0.8)';
          ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(px, py, 22, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [compact, showSweep, hover, mode, highlight]);

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    const cx = r.width / 2, cy = r.height / 2;
    const R = Math.min(r.width, r.height) * (compact ? 0.45 : 0.46);
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const drones = dronesRef.current;
    let near: string | null = null, nearD = 16;
    drones.forEach(d => {
      const px = cx + d.x * R, py = cy + d.y * R;
      const dd = Math.hypot(px - x, py - y);
      if (dd < nearD) { nearD = dd; near = d.cs; }
    });
    setHover(near);
    c.style.cursor = near ? 'pointer' : 'default';
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMove}
      onMouseLeave={() => setHover(null)}
      onClick={() => { if (hover && onPick) onPick(hover); }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}

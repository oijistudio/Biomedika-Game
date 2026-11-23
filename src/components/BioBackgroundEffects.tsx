import React, { useEffect, useRef } from 'react';

interface BioCell {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  kind: 'erythrocyte' | 'leukocyte' | 'vesicle';
  phase: number;
  angle: number;
  spin: number;
}

/**
 * Efek visual biologi ringan berbasis Canvas 2D untuk beranda dominan putih:
 * menampilkan sel darah merah tipis, sel imun dengan inti mikro, vesikel,
 * serta jejaring sinaptik halus saat sel berdekatan atau mengikuti kursor.
 */
export const BioBackgroundEffects: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
    };
    resize();

    const cellCount = width < 768 ? 16 : 28;
    const cells: BioCell[] = [];
    for (let i = 0; i < cellCount; i++) {
      const roll = i % 5;
      const kind: BioCell['kind'] =
        roll === 0 || roll === 3 ? 'erythrocyte' : roll === 1 ? 'leukocyte' : 'vesicle';
      const r =
        kind === 'erythrocyte'
          ? 14 + Math.random() * 16
          : kind === 'leukocyte'
          ? 12 + Math.random() * 14
          : 4 + Math.random() * 6;
      cells.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 18,
        vy: -6 - Math.random() * 14,
        r,
        kind,
        phase: Math.random() * Math.PI * 2,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.25,
      });
    }

    const pointer = { x: width * 0.5, y: height * 0.5, active: false };
    const onPointerMove = (e: MouseEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };

    const drawFrame = (dt: number, elapsed: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Update cell coordinates
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        if (!prefersReduced) {
          c.x += (c.vx + Math.sin(elapsed * 0.6 + c.phase) * 5) * dt;
          c.y += c.vy * dt;
          c.angle += c.spin * dt;

          if (pointer.active) {
            const dx = pointer.x - c.x;
            const dy = pointer.y - c.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 1 && dist < 170) {
              const push = ((170 - dist) / 170) * 14 * dt;
              c.x -= (dx / dist) * push;
              c.y -= (dy / dist) * push;
            }
          }

          if (c.y < -c.r * 2) {
            c.y = height + c.r * 2;
            c.x = Math.random() * width;
          }
          if (c.x < -c.r * 2) c.x = width + c.r * 2;
          if (c.x > width + c.r * 2) c.x = -c.r * 2;
        }
      }

      // Draw fine synaptic / capillary filaments between nearby cells
      ctx.lineWidth = 0.9;
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          const a = cells[i];
          const b = cells[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 155) {
            const alpha = (1 - d / 155) * 0.14;
            ctx.strokeStyle = `rgba(8, 145, 178, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw translucent biological cells
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.angle);

        if (c.kind === 'erythrocyte') {
          // Biconcave red cell outline + inner depression ring
          ctx.scale(1, 0.78);
          ctx.fillStyle = 'rgba(244, 63, 94, 0.045)';
          ctx.strokeStyle = 'rgba(225, 29, 72, 0.14)';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.arc(0, 0, c.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = 'rgba(225, 29, 72, 0.09)';
          ctx.beginPath();
          ctx.arc(0, 0, c.r * 0.45, 0, Math.PI * 2);
          ctx.stroke();
        } else if (c.kind === 'leukocyte') {
          // Immune cell membrane with subtle nucleus
          ctx.fillStyle = 'rgba(8, 145, 178, 0.045)';
          ctx.strokeStyle = 'rgba(8, 145, 178, 0.16)';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.arc(0, 0, c.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = 'rgba(13, 148, 136, 0.12)';
          ctx.beginPath();
          ctx.arc(c.r * 0.14, -c.r * 0.08, c.r * 0.36, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Bio-vesicle micro droplet
          ctx.fillStyle = 'rgba(14, 116, 144, 0.07)';
          ctx.strokeStyle = 'rgba(14, 116, 144, 0.18)';
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.arc(0, 0, c.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      }
    };

    let rafId = 0;
    let lastTime = performance.now();
    const startTime = lastTime;

    if (prefersReduced) {
      drawFrame(0, 0);
    } else {
      const loop = (now: number) => {
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
        lastTime = now;
        drawFrame(dt, (now - startTime) / 1000);
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onPointerMove);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onPointerMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10 h-full w-full"
    />
  );
};

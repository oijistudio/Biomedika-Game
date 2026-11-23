import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Crosshair,
  HeartPulse,
  Pause,
  Shield,
  Sparkles,
  Vibrate,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { HudSnapshot, WeaponId, WEAPONS, ZONES } from '../game/types';

interface GameHUDProps {
  hud: HudSnapshot;
  onSelectWeapon: (id: WeaponId) => void;
  onToggleRayTracing: () => void;
  onToggleMute: () => void;
  onToggleHaptics: () => void;
  onPause: () => void;
  onMobileInput: (
    moveX: number,
    moveZ: number,
    aimX?: number,
    aimY?: number,
    firing?: boolean
  ) => void;
  onMobileBoost: () => void;
  onMobileAssist: () => void;
}

const ZONE_RING_COLORS = [
  '#fb7185',
  '#f472b6',
  '#ef4444',
  '#38bdf8',
  '#f43f5e',
  '#fbbf24',
  '#34d399',
  '#fb923c',
  '#f59e0b',
  '#fef08a',
] as const;

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  onSelectWeapon,
  onToggleRayTracing,
  onToggleMute,
  onToggleHaptics,
  onPause,
  onMobileInput,
  onMobileBoost,
  onMobileAssist,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [reticlePos, setReticlePos] = useState({ x: 50, y: 50 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [stickOffset, setStickOffset] = useState({ x: 0, y: 0 });
  const stickRef = useRef<HTMLDivElement | null>(null);
  const stickTouchId = useRef<number | null>(null);
  const aimTouchId = useRef<number | null>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastImpactIdRef = useRef(0);
  const fxStateRef = useRef<{
    particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      life: number;
      maxLife: number;
      color: string;
      drag: number;
      shard: boolean;
    }>;
    rings: Array<{
      x: number;
      y: number;
      r: number;
      maxR: number;
      life: number;
      maxLife: number;
      color: string;
      lineWidth: number;
    }>;
    flashOpacity: number;
    flashKind: 'none' | 'damage' | 'bossKill' | 'heavyKill';
    rafId: number | null;
    lastTime: number;
  }>({
    particles: [],
    rings: [],
    flashOpacity: 0,
    flashKind: 'none',
    rafId: null,
    lastTime: 0,
  });

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const onMove = (e: MouseEvent) => {
      setReticlePos({
        x: (e.clientX / Math.max(1, window.innerWidth)) * 100,
        y: (e.clientY / Math.max(1, window.innerHeight)) * 100,
      });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyH') setDockCollapsed((v) => !v);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // Screen-space impact particles, shockwave rings & vignette flash loop
  useEffect(() => {
    const canvas = fxCanvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      if (fxStateRef.current.rafId !== null) {
        cancelAnimationFrame(fxStateRef.current.rafId);
        fxStateRef.current.rafId = null;
      }
    };
  }, []);

  useEffect(() => {
    if (hud.impactEventId <= lastImpactIdRef.current || hud.impactFlashKind === 'none') return;
    lastImpactIdRef.current = hud.impactEventId;

    const fx = fxStateRef.current;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const diag = Math.hypot(w, h) * 0.52;

    fx.flashKind = hud.impactFlashKind;

    if (hud.impactFlashKind === 'damage') {
      fx.flashOpacity = 0.72;
      fx.rings.push({
        x: cx,
        y: cy,
        r: Math.min(w, h) * 0.36,
        maxR: diag,
        life: 0.36,
        maxLife: 0.36,
        color: '#fb7185',
        lineWidth: 5,
      });
      const palette = ['#fb7185', '#f43f5e', '#fb923c', '#fda4af'];
      for (let i = 0; i < 34; i++) {
        const edge = i % 4;
        let sx = 0;
        let sy = 0;
        if (edge === 0) {
          sx = Math.random() * w;
          sy = 0;
        } else if (edge === 1) {
          sx = Math.random() * w;
          sy = h;
        } else if (edge === 2) {
          sx = 0;
          sy = Math.random() * h;
        } else {
          sx = w;
          sy = Math.random() * h;
        }
        const angle = Math.atan2(cy - sy, cx - sx) + (Math.random() - 0.5) * 0.65;
        const speed = 380 + Math.random() * 540;
        const life = 0.32 + Math.random() * 0.25;
        fx.particles.push({
          x: sx,
          y: sy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2.5 + Math.random() * 3.5,
          life,
          maxLife: life,
          color: palette[i % palette.length],
          drag: 3.4,
          shard: i % 2 === 0,
        });
      }
    } else if (hud.impactFlashKind === 'bossKill') {
      fx.flashOpacity = 0.78;
      fx.rings.push(
        {
          x: cx,
          y: cy,
          r: 24,
          maxR: diag * 1.05,
          life: 0.72,
          maxLife: 0.72,
          color: '#fde047',
          lineWidth: 8,
        },
        {
          x: cx,
          y: cy,
          r: 12,
          maxR: diag * 0.82,
          life: 0.58,
          maxLife: 0.58,
          color: '#fb7185',
          lineWidth: 5,
        }
      );
      const palette = ['#fde047', '#fb7185', '#22d3ee', '#ffffff', '#34d399'];
      for (let i = 0; i < 74; i++) {
        const angle = (i / 74) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
        const speed = 260 + Math.random() * 980;
        const life = 0.55 + Math.random() * 0.45;
        fx.particles.push({
          x: cx + (Math.random() - 0.5) * 40,
          y: cy + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 4.5,
          life,
          maxLife: life,
          color: palette[i % palette.length],
          drag: 2.1,
          shard: i % 3 !== 0,
        });
      }
    } else {
      fx.flashOpacity = 0.36;
      fx.rings.push({
        x: cx,
        y: cy,
        r: 18,
        maxR: diag * 0.55,
        life: 0.4,
        maxLife: 0.4,
        color: '#22d3ee',
        lineWidth: 4,
      });
      const palette = ['#22d3ee', '#34d399', '#fde047', '#ffffff'];
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const speed = 220 + Math.random() * 580;
        const life = 0.35 + Math.random() * 0.28;
        fx.particles.push({
          x: cx + (Math.random() - 0.5) * 28,
          y: cy + (Math.random() - 0.5) * 28,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2.2 + Math.random() * 3,
          life,
          maxLife: life,
          color: palette[i % palette.length],
          drag: 2.8,
          shard: i % 2 === 0,
        });
      }
    }

    if (fx.rafId === null) {
      fx.lastTime = performance.now();
      const tick = (now: number) => {
        const dt = Math.min(0.05, Math.max(0.001, (now - fx.lastTime) / 1000));
        fx.lastTime = now;

        const canvas = fxCanvasRef.current;
        if (!canvas) {
          fx.rafId = null;
          return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          fx.rafId = null;
          return;
        }

        const cw = window.innerWidth;
        const ch = window.innerHeight;
        const dpr = canvas.width / Math.max(1, cw);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cw, ch);

        // Edge vignette / central impact flash
        if (fx.flashOpacity > 0.005) {
          if (fx.flashKind === 'damage') {
            const grad = ctx.createRadialGradient(
              cw * 0.5,
              ch * 0.5,
              Math.min(cw, ch) * 0.22,
              cw * 0.5,
              ch * 0.5,
              Math.hypot(cw, ch) * 0.56
            );
            grad.addColorStop(0, 'rgba(244, 63, 94, 0)');
            grad.addColorStop(0.65, `rgba(225, 29, 72, ${(fx.flashOpacity * 0.28).toFixed(3)})`);
            grad.addColorStop(1, `rgba(244, 63, 94, ${(fx.flashOpacity * 0.72).toFixed(3)})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, cw, ch);
          } else {
            const rgb = fx.flashKind === 'bossKill' ? '253, 224, 71' : '34, 211, 238';
            const grad = ctx.createRadialGradient(
              cw * 0.5,
              ch * 0.5,
              10,
              cw * 0.5,
              ch * 0.5,
              Math.hypot(cw, ch) * 0.62
            );
            grad.addColorStop(0, `rgba(255, 255, 255, ${(fx.flashOpacity * 0.34).toFixed(3)})`);
            grad.addColorStop(0.45, `rgba(${rgb}, ${(fx.flashOpacity * 0.22).toFixed(3)})`);
            grad.addColorStop(1, `rgba(${rgb}, 0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, cw, ch);
          }
          fx.flashOpacity = Math.max(0, fx.flashOpacity - dt * 2.2);
        }

        // Shockwave rings
        for (let i = fx.rings.length - 1; i >= 0; i--) {
          const ring = fx.rings[i];
          ring.life -= dt;
          if (ring.life <= 0) {
            fx.rings.splice(i, 1);
            continue;
          }
          const progress = 1 - ring.life / ring.maxLife;
          const eased = 1 - Math.pow(1 - progress, 3);
          const curR = ring.r + (ring.maxR - ring.r) * eased;
          ctx.save();
          ctx.globalAlpha = (1 - progress) * 0.75;
          ctx.strokeStyle = ring.color;
          ctx.lineWidth = Math.max(1, ring.lineWidth * (1 - progress));
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, curR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Screen-space particles (streaking sparks & shards)
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = fx.particles.length - 1; i >= 0; i--) {
          const p = fx.particles[i];
          p.life -= dt;
          if (p.life <= 0) {
            fx.particles.splice(i, 1);
            continue;
          }
          const damp = Math.exp(-p.drag * dt);
          p.vx *= damp;
          p.vy *= damp;
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          const alpha = Math.min(1, (p.life / p.maxLife) * 1.25);
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = p.color;
          ctx.fillStyle = p.color;

          if (p.shard) {
            const speed = Math.hypot(p.vx, p.vy);
            const len = Math.max(p.size * 2.2, Math.min(34, speed * 0.045));
            const nx = speed > 1 ? p.vx / speed : 1;
            const ny = speed > 1 ? p.vy / speed : 0;
            ctx.lineWidth = p.size * 0.7;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - nx * len, p.y - ny * len);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * alpha), 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();

        if (fx.particles.length > 0 || fx.rings.length > 0 || fx.flashOpacity > 0.005) {
          fx.rafId = requestAnimationFrame(tick);
        } else {
          fx.rafId = null;
          ctx.clearRect(0, 0, cw, ch);
        }
      };
      fx.rafId = requestAnimationFrame(tick);
    }
  }, [hud.impactEventId, hud.impactFlashKind]);

  const updateStickFromTouch = (clientX: number, clientY: number) => {
    const el = stickRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.42;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR && dist > 0.001) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setStickOffset({ x: dx, y: dy });
    // +X = right, +Y on screen = backward (+Z), -Y on screen = forward (-Z)
    onMobileInput(dx / maxR, dy / maxR);
  };

  const handleStickStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.changedTouches[0];
    if (!touch) return;
    stickTouchId.current = touch.identifier;
    updateStickFromTouch(touch.clientX, touch.clientY);
  };

  const handleStickMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === stickTouchId.current) {
        updateStickFromTouch(t.clientX, t.clientY);
        break;
      }
    }
  };

  const handleStickEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === stickTouchId.current) {
        stickTouchId.current = null;
        setStickOffset({ x: 0, y: 0 });
        onMobileInput(0, 0);
        break;
      }
    }
  };

  const handleAimTouch = (e: React.TouchEvent) => {
    const touch = Array.from(e.changedTouches).find((t) => t.identifier === aimTouchId.current) ?? e.changedTouches[0];
    if (!touch) return;
    if (e.type === 'touchstart') aimTouchId.current = touch.identifier;
    const sx = (touch.clientX / Math.max(1, window.innerWidth)) * 100;
    const sy = (touch.clientY / Math.max(1, window.innerHeight)) * 100;
    setReticlePos({ x: sx, y: sy });
    const ndcX = (touch.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    const ndcY = -(touch.clientY / Math.max(1, window.innerHeight)) * 2 + 1;
    onMobileInput(stickOffset.x / 40, stickOffset.y / 40, ndcX, ndcY);
    if (e.type === 'touchend' || e.type === 'touchcancel') {
      aimTouchId.current = null;
    }
  };

  const zone = ZONES[hud.zoneIndex] ?? ZONES[0];
  const weaponColor = WEAPONS[hud.activeWeapon].color;
  const ringAccent = ZONE_RING_COLORS[hud.zoneIndex] ?? '#22d3ee';
  const lockColor =
    hud.targetLock.kind === 'boss'
      ? '#fb7185'
      : hud.targetLock.kind === 'shield'
      ? '#facc15'
      : hud.targetLock.kind === 'neuro'
      ? '#c084fc'
      : hud.targetLock.kind === 'spore'
      ? '#fb923c'
      : '#a3e635';

  // Minimap coordinate mapping (scaled for widened anatomical corridors)
  const radarCx = 60;
  const radarCy = 68;
  const radarScale = 0.78;
  const toRadar = (dx: number, dz: number) => ({
    x: radarCx + dx * radarScale,
    y: radarCy + dz * radarScale,
  });

  const samples = hud.minimap.tunnelSamples;
  let tunnelPolygonPoints = '';
  let centerlinePoints = '';
  if (samples.length >= 2) {
    const leftEdge: string[] = [];
    const rightEdge: string[] = [];
    const centerLine: string[] = [];
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const ptL = toRadar(s.dx - s.r, s.dz);
      const ptR = toRadar(s.dx + s.r, s.dz);
      const ptC = toRadar(s.dx, s.dz);
      leftEdge.push(`${ptL.x.toFixed(1)},${ptL.y.toFixed(1)}`);
      rightEdge.unshift(`${ptR.x.toFixed(1)},${ptR.y.toFixed(1)}`);
      centerLine.push(`${ptC.x.toFixed(1)},${ptC.y.toFixed(1)}`);
    }
    tunnelPolygonPoints = [...leftEdge, ...rightEdge].join(' ');
    centerlinePoints = centerLine.join(' ');
  }

  const rawTarget = toRadar(hud.minimap.nextOrganDx, hud.minimap.nextOrganDz);
  const tVx = rawTarget.x - 60;
  const tVy = rawTarget.y - 60;
  const tDist = Math.hypot(tVx, tVy);
  const clampedTarget =
    tDist > 48 && tDist > 0.001
      ? { x: 60 + (tVx / tDist) * 48, y: 60 + (tVy / tDist) * 48 }
      : { x: rawTarget.x, y: rawTarget.y };

  const robotPt = toRadar(hud.minimap.robotDx, hud.minimap.robotDz);

  const shakeAmp = hud.screenShakeStrength > 0.03 ? hud.screenShakeStrength * 13 : 0;
  const hudShakeX =
    shakeAmp > 0 ? Math.sin(hud.elapsedSeconds * 123.7 + hud.impactEventId) * shakeAmp : 0;
  const hudShakeY =
    shakeAmp > 0 ? Math.cos(hud.elapsedSeconds * 149.3 + hud.impactEventId) * shakeAmp : 0;
  const hudShakeRot =
    shakeAmp > 0 ? Math.sin(hud.elapsedSeconds * 97.1) * hud.screenShakeStrength * 1.15 : 0;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-10 select-none"
      style={
        shakeAmp > 0
          ? {
              transform: `translate3d(${hudShakeX.toFixed(1)}px, ${hudShakeY.toFixed(1)}px, 0) rotate(${hudShakeRot.toFixed(2)}deg)`,
            }
          : undefined
      }
    >
      {/* Screen-Space Impact Particle, Shockwave & Edge Flash Canvas */}
      <canvas ref={fxCanvasRef} className="pointer-events-none fixed inset-0 z-30 h-full w-full" />
      {/* Touch-to-Aim Surface Layer for Mobile Devices */}
      {isTouchDevice && (
        <div
          className="pointer-events-auto fixed inset-0 z-0"
          onTouchStart={handleAimTouch}
          onTouchMove={handleAimTouch}
          onTouchEnd={handleAimTouch}
          onTouchCancel={handleAimTouch}
        />
      )}

      {/* Projected Target Lock-On Crosshair over Active Enemy (crosshair only, no text) */}
      {hud.targetLock.active && (
        <div
          className="fixed -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
          style={{ left: `${hud.targetLock.screenX}%`, top: `${hud.targetLock.screenY}%` }}
        >
          <svg width="62" height="62" viewBox="0 0 64 64" fill="none">
            <path
              d="M16 6 H6 V16 M48 6 H58 V16 M16 58 H6 V48 M48 58 H58 V48"
              stroke={lockColor}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polygon
              points="32,12 52,32 32,52 12,32"
              stroke={lockColor}
              strokeWidth="1.4"
              strokeDasharray="5 4"
              opacity="0.88"
            />
            <circle cx="32" cy="32" r="3" fill={lockColor} />
          </svg>
        </div>
      )}

      {/* Dynamic Precision Targeting Reticle */}
      <div
        className="fixed -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
        style={{ left: `${reticlePos.x}%`, top: `${reticlePos.y}%` }}
      >
        <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
          <circle
            cx="24"
            cy="24"
            r={hud.targetLock.active ? 18 : 15}
            stroke={hud.targetLock.active ? lockColor : weaponColor}
            strokeWidth={hud.targetLock.active ? '2' : '1.5'}
            strokeDasharray="6 5"
            opacity="0.9"
          />
          <circle cx="24" cy="24" r="2.4" fill={hud.targetLock.active ? lockColor : weaponColor} />
          <path
            d="M24 3 V9 M24 39 V45 M3 24 H9 M39 24 H45"
            stroke={hud.targetLock.active ? lockColor : weaponColor}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {hud.targetLock.active && (
            <path
              d="M12 7 L7 12 M36 7 L41 12 M12 41 L7 36 M36 41 L41 36"
              stroke={lockColor}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>

      {/* Top Perimeter Status Clusters */}
      <div className="relative z-10 flex items-start justify-between gap-2 p-2.5 sm:gap-4 sm:p-4 md:p-5">
        {/* Top-Left: Pod Integrity, Bio-Energy, Zone & Patient Vitality */}
        <div
          className="flex max-w-[235px] flex-col gap-2 rounded-xl border border-cyan-500/25 px-3 py-2.5 text-slate-100 shadow-lg sm:max-w-none sm:min-w-[265px] sm:px-4 sm:py-3"
          style={{ backgroundColor: 'rgba(7, 13, 24, 0.82)' }}
        >
          <div className="flex items-center justify-between gap-2 text-[10px] font-bold tracking-wider uppercase sm:text-xs">
            <span className="truncate text-cyan-300">{zone.name}</span>
            <span className="shrink-0 tabular-nums text-slate-300">
              {hud.zoneIndex >= 5 && hud.zoneIndex <= 8
                ? `Sektor #${hud.endlessSector}`
                : hud.zoneIndex === 9
                ? 'Gerbang Anus!'
                : hud.zoneRemainingEnemies > 0
                ? `${hud.zoneRemainingEnemies} Patogen`
                : 'Terbuka'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            <div className="h-2 flex-1 overflow-hidden rounded-sm bg-slate-800">
              <div
                className="h-full transition-all duration-150"
                style={{
                  width: `${Math.max(0, Math.min(100, (hud.hull / hud.maxHull) * 100))}%`,
                  backgroundColor: hud.hull > 35 ? '#10b981' : '#f43f5e',
                }}
              />
            </div>
            <span className="w-9 text-right text-[11px] font-bold tabular-nums sm:text-xs">{hud.hull}%</span>
          </div>

          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
            <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-slate-800">
              <div
                className="h-full bg-cyan-400 transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, (hud.energy / hud.maxEnergy) * 100))}%` }}
              />
            </div>
            <span className="w-9 text-right text-[11px] font-semibold tabular-nums text-cyan-200 sm:text-xs">
              {hud.energy}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-700/70 pt-1.5 text-[10px] text-slate-300 sm:text-[11px]">
            <span className="flex items-center gap-1">
              <HeartPulse className="h-3 w-3 text-rose-400 sm:h-3.5 sm:w-3.5" />
              Raka: <strong className="tabular-nums text-rose-300">{hud.patientVitality}%</strong>
            </span>
            <span className="tabular-nums text-slate-400">
              {hud.distanceMeters.toLocaleString('id-ID')}m / {hud.targetExitMeters.toLocaleString('id-ID')}m
            </span>
          </div>
        </div>

        {/* Top-Center: Boss Health Bar */}
        {hud.bossActive && (
          <div
            className="hidden flex-col items-center gap-1.5 rounded-xl border border-rose-500/45 px-5 py-2.5 shadow-lg lg:flex"
            style={{ backgroundColor: 'rgba(26, 7, 14, 0.86)', minWidth: '320px' }}
          >
            <div className="flex w-full items-center justify-between text-xs font-extrabold tracking-widest text-rose-300 uppercase">
              <span>{hud.bossName}</span>
              <span className="tabular-nums">
                {hud.bossHp} / {hud.bossMaxHp}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-sm bg-rose-950">
              <div
                className="h-full bg-rose-500 transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, (hud.bossHp / hud.bossMaxHp) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Top-Right: Score, Kills, Ray Tracing, Haptics, Mute & Pause */}
        <div className="flex flex-col items-end gap-1.5 sm:gap-2">
          <div
            className="flex items-center gap-2.5 rounded-xl border border-slate-700/70 px-3 py-2 text-slate-100 sm:gap-4 sm:px-4 sm:py-2.5"
            style={{ backgroundColor: 'rgba(7, 13, 24, 0.82)' }}
          >
            <div className="text-right">
              <div className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase sm:text-[10px]">
                Skor
              </div>
              <div className="text-sm font-extrabold tabular-nums text-cyan-300 sm:text-base">
                {hud.score.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="h-6 w-px bg-slate-700 sm:h-7" />
            <div className="text-right">
              <div className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase sm:text-[10px]">
                Virus
              </div>
              <div className="text-sm font-extrabold tabular-nums text-emerald-300 sm:text-base">{hud.kills}</div>
            </div>
            {hud.combo > 1 && (
              <>
                <div className="h-6 w-px bg-slate-700 sm:h-7" />
                <div className="text-right">
                  <div className="text-[9px] font-semibold tracking-wider text-amber-400 uppercase sm:text-[10px]">
                    Kombo
                  </div>
                  <div className="text-sm font-extrabold tabular-nums text-amber-300 sm:text-base">x{hud.combo}</div>
                </div>
              </>
            )}
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onToggleRayTracing}
              className={`flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold tracking-wide sm:px-3 sm:text-xs ${
                hud.rayTracingEnabled
                  ? 'border-cyan-400/60 text-cyan-200'
                  : 'border-slate-600/70 text-slate-400'
              }`}
              style={{ backgroundColor: 'rgba(7, 13, 24, 0.86)' }}
              title="Toggle Ray Tracing (R)"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>RT {hud.rayTracingEnabled ? 'ON' : 'OFF'}</span>
            </button>
            <button
              type="button"
              onClick={onToggleHaptics}
              aria-label="Getaran Haptic Mobile"
              className={`cursor-pointer rounded-lg border p-1.5 sm:p-2 ${
                hud.hapticsEnabled
                  ? 'border-emerald-400/60 text-emerald-300'
                  : 'border-slate-600/70 text-slate-400'
              }`}
              style={{ backgroundColor: 'rgba(7, 13, 24, 0.86)' }}
              title={hud.hapticsSupported ? 'Haptic Feedback' : 'Haptic (khusus perangkat pendukung)'}
            >
              <Vibrate className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={hud.muted ? 'Aktifkan Suara' : 'Matikan Suara'}
              className="cursor-pointer rounded-lg border border-slate-600/70 p-1.5 text-slate-200 hover:border-cyan-400/60 sm:p-2"
              style={{ backgroundColor: 'rgba(7, 13, 24, 0.86)' }}
            >
              {hud.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onPause}
              aria-label="Jeda Game"
              className="cursor-pointer rounded-lg border border-slate-600/70 p-1.5 text-slate-200 hover:border-cyan-400/60 sm:p-2"
              style={{ backgroundColor: 'rgba(7, 13, 24, 0.86)' }}
            >
              <Pause className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transparent Circular Anatomical Minimap with Branches & Obstacles */}
      <div className="fixed right-3 top-28 z-10 flex flex-col items-center gap-1 md:top-auto md:right-4 md:bottom-4">
        <div
          className="relative h-24 w-24 rounded-full border sm:h-28 sm:w-28 md:h-36 md:w-36"
          style={{
            backgroundColor: 'rgba(6, 12, 24, 0.36)',
            borderColor: `${ringAccent}88`,
          }}
          aria-label="Minimap Anatomi & Cabang Organ"
        >
          <svg viewBox="0 0 120 120" className="h-full w-full">
            <defs>
              <clipPath id="minimapClip">
                <circle cx="60" cy="60" r="55" />
              </clipPath>
            </defs>

            <circle cx="60" cy="60" r="55" fill="none" stroke={ringAccent} strokeOpacity="0.28" strokeWidth="1" />
            <circle cx="60" cy="60" r="37" fill="none" stroke="#94a3b8" strokeOpacity="0.16" strokeWidth="0.8" strokeDasharray="3 3" />
            <circle cx="60" cy="60" r="19" fill="none" stroke="#94a3b8" strokeOpacity="0.16" strokeWidth="0.8" />
            <line x1="60" y1="5" x2="60" y2="115" stroke="#94a3b8" strokeOpacity="0.14" strokeWidth="0.8" />
            <line x1="5" y1="68" x2="115" y2="68" stroke="#94a3b8" strokeOpacity="0.14" strokeWidth="0.8" />

            <g clipPath="url(#minimapClip)">
              {/* Side Branches Ducts off main tunnel */}
              {hud.minimap.branches.map((b, idx) => {
                const pt = toRadar(b.dx, b.dz);
                const endX = pt.x + b.side * 16;
                const endY = pt.y - 10;
                return (
                  <line
                    key={`br-${idx}`}
                    x1={pt.x}
                    y1={pt.y}
                    x2={endX}
                    y2={endY}
                    stroke={ringAccent}
                    strokeOpacity="0.52"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                );
              })}

              {tunnelPolygonPoints && (
                <polygon
                  points={tunnelPolygonPoints}
                  fill={ringAccent}
                  fillOpacity="0.14"
                  stroke={ringAccent}
                  strokeOpacity="0.48"
                  strokeWidth="1.2"
                />
              )}
              {centerlinePoints && (
                <polyline
                  points={centerlinePoints}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeOpacity="0.24"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
              )}

              {/* Bifurcation Septum Pillars */}
              {hud.minimap.obstacles.map((obs, idx) => {
                const pt = toRadar(obs.dx, obs.dz);
                return (
                  <circle
                    key={`obs-${idx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={Math.max(2.5, obs.r * radarScale)}
                    fill="#fb7185"
                    fillOpacity="0.55"
                    stroke="#fecdd3"
                    strokeWidth="0.8"
                  />
                );
              })}

              {/* Nearby Pathogens, Boss & Shield Nodes */}
              {hud.minimap.enemies.map((e, idx) => {
                const pt = toRadar(e.dx, e.dz);
                const fill = e.isShieldNode
                  ? '#facc15'
                  : e.kind === 'boss'
                  ? '#f43f5e'
                  : e.kind === 'neuro'
                  ? '#c084fc'
                  : e.kind === 'spore'
                  ? '#fb923c'
                  : '#a3e635';
                const r = e.kind === 'boss' ? 4.4 : e.isShieldNode ? 3.0 : 2.3;
                return (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={r}
                    fill={fill}
                    stroke="#070c16"
                    strokeWidth="0.7"
                  />
                );
              })}

              {/* Target Organ Waypoint */}
              <g transform={`translate(${clampedTarget.x}, ${clampedTarget.y})`}>
                <polygon
                  points="0,-5 4.5,0 0,5 -4.5,0"
                  fill="#34d399"
                  stroke="#042f2e"
                  strokeWidth="1"
                />
              </g>

              {/* B.I.O.-7 Robot Companion Marker */}
              <rect
                x={robotPt.x - 2.1}
                y={robotPt.y - 2.1}
                width="4.2"
                height="4.2"
                transform={`rotate(45 ${robotPt.x} ${robotPt.y})`}
                fill="#fbbf24"
                stroke="#070c16"
                strokeWidth="0.6"
              />

              {/* Player Nano-Pod Chevron */}
              <polygon
                points={`${radarCx},${radarCy - 5.5} ${radarCx + 4.2},${radarCy + 4.2} ${radarCx},${radarCy + 2} ${radarCx - 4.2},${radarCy + 4.2}`}
                fill="#22d3ee"
                stroke="#ffffff"
                strokeWidth="0.9"
              />
            </g>

            {/* 10-Organ Journey Waypoint Arc at Bottom Rim */}
            {([0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((idx) => {
              const angle = Math.PI * 0.82 - (idx / 9) * (Math.PI * 0.64);
              const ox = 60 + Math.cos(angle) * 51;
              const oy = 60 + Math.sin(angle) * 51;
              const passedOrCurrent = idx <= hud.zoneIndex;
              const isCurrent = idx === hud.zoneIndex;
              return (
                <circle
                  key={idx}
                  cx={ox}
                  cy={oy}
                  r={isCurrent ? 2.8 : 1.7}
                  fill={isCurrent ? '#22d3ee' : passedOrCurrent ? '#34d399' : '#475569'}
                  stroke="#070c16"
                  strokeWidth="0.6"
                />
              );
            })}
          </svg>
        </div>

        <div
          className="rounded-md border border-slate-700/70 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-200 tabular-nums sm:text-[10px]"
          style={{ backgroundColor: 'rgba(6, 12, 24, 0.72)' }}
        >
          {hud.minimap.nextOrganLabel} · {hud.minimap.nextOrganDistance}m
        </div>
      </div>

      {/* Mobile Touch Virtual Joystick (Bottom-Left) + Fire/Boost/Assist Buttons (Bottom-Right) */}
      {isTouchDevice && (
        <>
          <div
            ref={stickRef}
            onTouchStart={handleStickStart}
            onTouchMove={handleStickMove}
            onTouchEnd={handleStickEnd}
            onTouchCancel={handleStickEnd}
            className="pointer-events-auto fixed bottom-24 left-4 z-20 flex h-28 w-28 items-center justify-center rounded-full border border-cyan-400/45 md:bottom-28"
            style={{ backgroundColor: 'rgba(8, 15, 28, 0.45)', touchAction: 'none' }}
            aria-label="Joystick Gerak Kapal"
          >
            <div className="pointer-events-none absolute inset-3 rounded-full border border-dashed border-cyan-400/25" />
            <div
              className="pointer-events-none h-11 w-11 rounded-full border border-cyan-200/80 bg-cyan-400/55 shadow-lg"
              style={{
                transform: `translate(${stickOffset.x}px, ${stickOffset.y}px)`,
              }}
            />
          </div>

          <div className="pointer-events-auto fixed right-4 bottom-24 z-20 flex flex-col items-end gap-2.5 md:bottom-28">
            <div className="flex gap-2">
              <button
                type="button"
                onTouchStart={(e) => {
                  e.stopPropagation();
                  onMobileAssist();
                }}
                onClick={onMobileAssist}
                className={`rounded-xl border px-3 py-2 text-[11px] font-extrabold uppercase ${
                  hud.bioAssistReady
                    ? 'border-amber-300/80 bg-amber-500/35 text-amber-100'
                    : 'border-slate-700 bg-slate-900/60 text-slate-500'
                }`}
              >
                B.I.O.-7
              </button>
              <button
                type="button"
                onTouchStart={(e) => {
                  e.stopPropagation();
                  onMobileBoost();
                }}
                onClick={onMobileBoost}
                className={`rounded-xl border px-3 py-2 text-[11px] font-extrabold uppercase ${
                  hud.boostCooldown <= 0
                    ? 'border-emerald-300/80 bg-emerald-500/35 text-emerald-100'
                    : 'border-slate-700 bg-slate-900/60 text-slate-500'
                }`}
              >
                {hud.boostCooldown <= 0 ? 'BOOST' : `${hud.boostCooldown}s`}
              </button>
            </div>
            <button
              type="button"
              onTouchStart={(e) => {
                e.stopPropagation();
                onMobileInput(stickOffset.x / 40, stickOffset.y / 40, undefined, undefined, true);
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                onMobileInput(stickOffset.x / 40, stickOffset.y / 40, undefined, undefined, false);
              }}
              onTouchCancel={(e) => {
                e.stopPropagation();
                onMobileInput(stickOffset.x / 40, stickOffset.y / 40, undefined, undefined, false);
              }}
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyan-300 bg-cyan-500/45 text-white shadow-xl active:scale-95"
              style={{ touchAction: 'none' }}
              aria-label="Tombol Tembak"
            >
              <Crosshair className="h-7 w-7" />
            </button>
          </div>
        </>
      )}

      {/* Collapsible Bottom Control Dock */}
      <div
        className={`fixed bottom-3 left-1/2 z-10 -translate-x-1/2 transition-transform duration-200 md:bottom-4 md:left-[calc(50%-72px)] ${
          dockCollapsed ? 'translate-y-[calc(100%-24px)]' : 'translate-y-0'
        }`}
        style={{ width: 'min(640px, calc(100vw - 24px))' }}
      >
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setDockCollapsed((v) => !v)}
            className="pointer-events-auto flex cursor-pointer items-center gap-1.5 rounded-t-lg border border-b-0 border-cyan-500/30 px-3 py-0.5 text-[10px] font-semibold text-cyan-200 sm:px-3.5 sm:py-1 sm:text-[11px]"
            style={{ backgroundColor: 'rgba(7, 13, 24, 0.88)' }}
          >
            {dockCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            <span>{dockCollapsed ? 'Tampilkan Kontrol (H)' : 'Sembunyikan HUD (H)'}</span>
          </button>
        </div>

        <div
          className="pointer-events-auto flex flex-col gap-1.5 rounded-xl border border-cyan-500/30 px-3 py-2 shadow-xl sm:gap-2 sm:px-4 sm:py-2.5"
          style={{ backgroundColor: 'rgba(7, 13, 24, 0.86)' }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-1.5 text-[11px] sm:text-xs">
            <span className="truncate font-medium text-amber-200">{hud.bioMessage}</span>
            <div className="hidden shrink-0 items-center gap-2.5 text-[10px] font-semibold sm:flex lg:text-[11px]">
              <span className="text-slate-300">[Scroll] Maju/Mundur</span>
              <span className="text-slate-300">[Klik Kanan] Senjata</span>
              <span className={hud.bioAssistReady ? 'text-cyan-300' : 'text-slate-500'}>
                [F] B.I.O.-7 {hud.bioAssistReady ? 'SIAP' : 'ISI'}
              </span>
              <span className={hud.boostCooldown <= 0 ? 'text-emerald-300' : 'text-slate-500'}>
                [Spasi] Boost {hud.boostCooldown <= 0 ? 'SIAP' : `${hud.boostCooldown}s`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {([1, 2, 3] as WeaponId[]).map((id) => {
              const w = WEAPONS[id];
              const active = hud.activeWeapon === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectWeapon(id)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border px-2 py-1.5 text-left transition-colors sm:px-3 ${
                    active ? 'border-cyan-400/80 text-white' : 'border-slate-700/70 text-slate-400 hover:text-slate-200'
                  }`}
                  style={{
                    backgroundColor: active ? 'rgba(14, 116, 144, 0.35)' : 'rgba(15, 23, 42, 0.55)',
                  }}
                >
                  <div className="flex items-center gap-1.5 truncate sm:gap-2">
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-sm sm:h-2.5 sm:w-2.5"
                      style={{ backgroundColor: w.color }}
                    />
                    <span className="truncate text-[11px] font-bold sm:text-xs">{w.shortName}</span>
                  </div>
                  <kbd className="ml-1 hidden rounded border border-slate-600 px-1.5 py-0.5 text-[10px] font-bold text-slate-300 sm:inline-block">
                    {w.key}
                  </kbd>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

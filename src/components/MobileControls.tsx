import React, { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Bot, Crosshair, Move, Rocket } from 'lucide-react';

interface MobileControlsProps {
  onMove: (x: number, z: number, y: number) => void;
  onAim: (ndcX: number, ndcY: number, firing: boolean) => void;
  onBoost: () => void;
  onBioAssist: () => void;
  boostCooldown: number;
  bioAssistReady: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onAim,
  onBoost,
  onBioAssist,
  boostCooldown,
  bioAssistReady,
}) => {
  const [leftKnob, setLeftKnob] = useState({ x: 0, y: 0 });
  const [rightKnob, setRightKnob] = useState({ x: 0, y: 0 });
  const [elev, setElev] = useState(0);

  const leftOrigin = useRef<{ x: number; y: number; id: number | null }>({ x: 0, y: 0, id: null });
  const rightOrigin = useRef<{ x: number; y: number; id: number | null }>({ x: 0, y: 0, id: null });
  const moveAxes = useRef({ x: 0, z: 0 });

  const maxRadius = 42;

  const updateLeft = (clientX: number, clientY: number) => {
    const dx = clientX - leftOrigin.current.x;
    const dy = clientY - leftOrigin.current.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const kx = dist > 0.01 ? Math.cos(angle) * clamped : 0;
    const ky = dist > 0.01 ? Math.sin(angle) * clamped : 0;

    setLeftKnob({ x: kx, y: ky });
    const nx = kx / maxRadius;
    const nz = ky / maxRadius; // up on stick (negative ky) -> forward (-Z)
    moveAxes.current = { x: nx, z: nz };
    onMove(nx, nz, elev);
  };

  const handleLeftDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    leftOrigin.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      id: e.pointerId,
    };
    updateLeft(e.clientX, e.clientY);
  };

  const handleLeftMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (leftOrigin.current.id !== e.pointerId) return;
    e.preventDefault();
    updateLeft(e.clientX, e.clientY);
  };

  const handleLeftUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (leftOrigin.current.id !== e.pointerId) return;
    leftOrigin.current.id = null;
    setLeftKnob({ x: 0, y: 0 });
    moveAxes.current = { x: 0, z: 0 };
    onMove(0, 0, elev);
  };

  const setAltitude = (nextY: number) => {
    setElev(nextY);
    onMove(moveAxes.current.x, moveAxes.current.z, nextY);
  };

  const updateRight = (clientX: number, clientY: number) => {
    const dx = clientX - rightOrigin.current.x;
    const dy = clientY - rightOrigin.current.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const kx = dist > 0.01 ? Math.cos(angle) * clamped : 0;
    const ky = dist > 0.01 ? Math.sin(angle) * clamped : 0;

    setRightKnob({ x: kx, y: ky });
    // Map thumb deflection to screen NDC aim (-0.85..0.85) and fire continuously
    onAim((kx / maxRadius) * 0.85, -(ky / maxRadius) * 0.85, true);
  };

  const handleRightDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    rightOrigin.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      id: e.pointerId,
    };
    updateRight(e.clientX, e.clientY);
  };

  const handleRightMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (rightOrigin.current.id !== e.pointerId) return;
    e.preventDefault();
    updateRight(e.clientX, e.clientY);
  };

  const handleRightUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (rightOrigin.current.id !== e.pointerId) return;
    rightOrigin.current.id = null;
    setRightKnob({ x: 0, y: 0 });
    onAim(0, 0, false);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-20 flex items-end justify-between px-4 sm:bottom-24 sm:px-6">
      {/* Left Cluster: Virtual Movement Joystick + Up/Down Altitude Buttons */}
      <div className="pointer-events-auto flex items-end gap-2.5">
        <div
          onPointerDown={handleLeftDown}
          onPointerMove={handleLeftMove}
          onPointerUp={handleLeftUp}
          onPointerCancel={handleLeftUp}
          className="relative flex h-28 w-28 touch-none items-center justify-center rounded-full border border-cyan-400/45 select-none"
          style={{ backgroundColor: 'rgba(6, 12, 24, 0.45)', touchAction: 'none' }}
          aria-label="Joystick Gerak Maju Mundur Kiri Kanan"
        >
          <div className="pointer-events-none absolute inset-2 rounded-full border border-dashed border-cyan-400/20" />
          <div
            className="pointer-events-none flex h-12 w-12 items-center justify-center rounded-full border border-cyan-300/80 shadow-lg"
            style={{
              backgroundColor: 'rgba(34, 211, 238, 0.35)',
              transform: `translate(${leftKnob.x}px, ${leftKnob.y}px)`,
            }}
          >
            <Move className="h-5 w-5 text-cyan-100" />
          </div>
          <span className="pointer-events-none -bottom-5 absolute text-[9px] font-bold tracking-wider text-cyan-200/80 uppercase">
            Gerak
          </span>
        </div>

        {/* Vertical Altitude Controls (Naik / Turun) */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              setAltitude(1);
            }}
            onPointerUp={() => setAltitude(0)}
            onPointerCancel={() => setAltitude(0)}
            onPointerLeave={() => setAltitude(0)}
            className="flex h-11 w-11 touch-none items-center justify-center rounded-full border border-cyan-400/45 text-cyan-100 active:bg-cyan-500/40"
            style={{ backgroundColor: 'rgba(6, 12, 24, 0.55)', touchAction: 'none' }}
            aria-label="Naik"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              setAltitude(-1);
            }}
            onPointerUp={() => setAltitude(0)}
            onPointerCancel={() => setAltitude(0)}
            onPointerLeave={() => setAltitude(0)}
            className="flex h-11 w-11 touch-none items-center justify-center rounded-full border border-cyan-400/45 text-cyan-100 active:bg-cyan-500/40"
            style={{ backgroundColor: 'rgba(6, 12, 24, 0.55)', touchAction: 'none' }}
            aria-label="Turun"
          >
            <ArrowDown className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Right Cluster: Boost & B.I.O.-7 Action Buttons + Aim & Fire Joystick */}
      <div className="pointer-events-auto flex items-end gap-2.5">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onBioAssist();
            }}
            disabled={!bioAssistReady}
            className={`flex h-11 w-11 touch-none flex-col items-center justify-center rounded-full border text-[9px] font-extrabold ${
              bioAssistReady
                ? 'border-amber-400/70 text-amber-200 active:bg-amber-500/35'
                : 'border-slate-700 text-slate-500'
            }`}
            style={{ backgroundColor: 'rgba(6, 12, 24, 0.62)', touchAction: 'none' }}
            aria-label="Bantu Robot BIO-7"
          >
            <Bot className="h-4 w-4" />
            <span>BIO</span>
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onBoost();
            }}
            disabled={boostCooldown > 0}
            className={`flex h-11 w-11 touch-none flex-col items-center justify-center rounded-full border text-[9px] font-extrabold ${
              boostCooldown <= 0
                ? 'border-emerald-400/70 text-emerald-200 active:bg-emerald-500/35'
                : 'border-slate-700 text-slate-500'
            }`}
            style={{ backgroundColor: 'rgba(6, 12, 24, 0.62)', touchAction: 'none' }}
            aria-label="Boost Kapal"
          >
            <Rocket className="h-4 w-4" />
            <span>{boostCooldown <= 0 ? 'DASH' : `${boostCooldown}s`}</span>
          </button>
        </div>

        <div
          onPointerDown={handleRightDown}
          onPointerMove={handleRightMove}
          onPointerUp={handleRightUp}
          onPointerCancel={handleRightUp}
          className="relative flex h-28 w-28 touch-none items-center justify-center rounded-full border border-rose-400/55 select-none"
          style={{ backgroundColor: 'rgba(24, 8, 16, 0.45)', touchAction: 'none' }}
          aria-label="Joystick Bidik dan Tembak"
        >
          <div className="pointer-events-none absolute inset-2 rounded-full border border-dashed border-rose-400/25" />
          <div
            className="pointer-events-none flex h-12 w-12 items-center justify-center rounded-full border border-rose-300/85 shadow-lg"
            style={{
              backgroundColor: 'rgba(244, 63, 94, 0.4)',
              transform: `translate(${rightKnob.x}px, ${rightKnob.y}px)`,
            }}
          >
            <Crosshair className="h-5 w-5 text-rose-100" />
          </div>
          <span className="pointer-events-none -bottom-5 absolute text-[9px] font-bold tracking-wider text-rose-200/80 uppercase">
            Bidik &amp; Tembak
          </span>
        </div>
      </div>
    </div>
  );
};

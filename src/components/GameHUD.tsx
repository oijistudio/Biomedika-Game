import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Pause,
  Shield,
  Sparkles,
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
  onPause: () => void;
}

const ZONE_RING_COLORS = ['#fb7185', '#ef4444', '#38bdf8', '#f43f5e', '#f59e0b', '#34d399'] as const;

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  onSelectWeapon,
  onToggleRayTracing,
  onToggleMute,
  onPause,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [reticlePos, setReticlePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
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

  const zone = ZONES[hud.zoneIndex];
  const weaponColor = WEAPONS[hud.activeWeapon].color;
  const ringAccent = ZONE_RING_COLORS[hud.zoneIndex];
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

  // Map world delta (dx, dz) relative to Pod into 120x120 circular radar SVG coordinates
  // Player Pod sits at (60, 68); forward (-Z) points UP (smaller Y).
  const radarCx = 60;
  const radarCy = 68;
  const radarScale = 0.92; // ~1px per 1.08 world units

  const toRadar = (dx: number, dz: number) => ({
    x: radarCx + dx * radarScale,
    y: radarCy + dz * radarScale,
  });

  // Build organic tunnel wall polygon from sampled centerline + radii
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

  // Target organ marker (clamped to radar edge r=48 around radar center (60, 60) if distant)
  const rawTarget = toRadar(hud.minimap.nextOrganDx, hud.minimap.nextOrganDz);
  const tVx = rawTarget.x - 60;
  const tVy = rawTarget.y - 60;
  const tDist = Math.hypot(tVx, tVy);
  const clampedTarget =
    tDist > 48 && tDist > 0.001
      ? { x: 60 + (tVx / tDist) * 48, y: 60 + (tVy / tDist) * 48, clamped: true }
      : { x: rawTarget.x, y: rawTarget.y, clamped: false };

  const robotPt = toRadar(hud.minimap.robotDx, hud.minimap.robotDz);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 select-none">
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
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
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
      <div className="flex items-start justify-between gap-4 p-4 md:p-5">
        {/* Top-Left: Pod Integrity, Bio-Energy, Zone & Patient Vitality */}
        <div
          className="flex flex-col gap-2.5 rounded-xl border border-cyan-500/25 px-4 py-3 text-slate-100 shadow-lg"
          style={{ backgroundColor: 'rgba(7, 13, 24, 0.82)', minWidth: '250px' }}
        >
          <div className="flex items-center justify-between gap-3 text-xs font-bold tracking-wider uppercase">
            <span className="text-cyan-300">{zone.name}</span>
            <span className="tabular-nums text-slate-300">
              {hud.zoneIndex === 4
                ? `Sektor Endless #${hud.endlessSector}`
                : hud.zoneIndex === 5
                ? 'Pintu Keluar!'
                : hud.zoneRemainingEnemies > 0
                ? `${hud.zoneRemainingEnemies} Patogen`
                : 'Gerbang Terbuka'}
            </span>
          </div>

          {/* Hull Integrity */}
          <div className="flex items-center gap-2.5">
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
            <span className="w-10 text-right text-xs font-bold tabular-nums">{hud.hull}%</span>
          </div>

          {/* Energy */}
          <div className="flex items-center gap-2.5">
            <Zap className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
            <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-slate-800">
              <div
                className="h-full bg-cyan-400 transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, (hud.energy / hud.maxEnergy) * 100))}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs font-semibold tabular-nums text-cyan-200">{hud.energy}</span>
          </div>

          {/* Patient Raka Vitality & Endless Distance Progress */}
          <div className="mt-0.5 flex items-center justify-between gap-2 border-t border-slate-700/70 pt-2 text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <HeartPulse className="h-3.5 w-3.5 text-rose-400" />
              Vitalitas Raka: <strong className="tabular-nums text-rose-300">{hud.patientVitality}%</strong>
            </span>
            <span className="tabular-nums text-slate-400">
              {hud.distanceMeters.toLocaleString('id-ID')}m / {hud.targetExitMeters.toLocaleString('id-ID')}m
            </span>
          </div>
        </div>

        {/* Top-Center: Boss Health Bar (only in Heart Chamber Boss Fight) */}
        {hud.bossActive && (
          <div
            className="hidden md:flex flex-col items-center gap-1.5 rounded-xl border border-rose-500/45 px-5 py-2.5 shadow-lg"
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

        {/* Top-Right: Score, Kills, Ray Tracing Toggle, Mute & Pause */}
        <div className="flex flex-col items-end gap-2">
          <div
            className="flex items-center gap-4 rounded-xl border border-slate-700/70 px-4 py-2.5 text-slate-100"
            style={{ backgroundColor: 'rgba(7, 13, 24, 0.82)' }}
          >
            <div className="text-right">
              <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Skor</div>
              <div className="text-base font-extrabold tabular-nums text-cyan-300">
                {hud.score.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="h-7 w-px bg-slate-700" />
            <div className="text-right">
              <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Virus</div>
              <div className="text-base font-extrabold tabular-nums text-emerald-300">{hud.kills}</div>
            </div>
            {hud.combo > 1 && (
              <>
                <div className="h-7 w-px bg-slate-700" />
                <div className="text-right">
                  <div className="text-[10px] font-semibold tracking-wider text-amber-400 uppercase">Kombo</div>
                  <div className="text-base font-extrabold tabular-nums text-amber-300">x{hud.combo}</div>
                </div>
              </>
            )}
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleRayTracing}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold tracking-wide ${
                hud.rayTracingEnabled
                  ? 'border-cyan-400/60 text-cyan-200'
                  : 'border-slate-600/70 text-slate-400'
              }`}
              style={{ backgroundColor: 'rgba(7, 13, 24, 0.86)' }}
              title="Toggle Ray Tracing (Tombol R)"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>RT {hud.rayTracingEnabled ? 'ON' : 'OFF'}</span>
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={hud.muted ? 'Aktifkan Suara' : 'Matikan Suara'}
              className="cursor-pointer rounded-lg border border-slate-600/70 p-2 text-slate-200 hover:border-cyan-400/60"
              style={{ backgroundColor: 'rgba(7, 13, 24, 0.86)' }}
            >
              {hud.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onPause}
              aria-label="Jeda Game"
              className="cursor-pointer rounded-lg border border-slate-600/70 p-2 text-slate-200 hover:border-cyan-400/60"
              style={{ backgroundColor: 'rgba(7, 13, 24, 0.86)' }}
            >
              <Pause className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transparent Circular Anatomical Minimap (Bottom-Right Corner) */}
      <div className="fixed right-4 bottom-24 flex flex-col items-center gap-1.5 md:bottom-4">
        <div
          className="relative h-28 w-28 rounded-full border md:h-36 md:w-36"
          style={{
            backgroundColor: 'rgba(6, 12, 24, 0.36)',
            borderColor: `${ringAccent}88`,
          }}
          aria-label="Minimap Anatomi & Radar Organ Target"
        >
          <svg viewBox="0 0 120 120" className="h-full w-full">
            <defs>
              <clipPath id="minimapClip">
                <circle cx="60" cy="60" r="55" />
              </clipPath>
            </defs>

            {/* Concentric Radar Rings & Crosshairs */}
            <circle cx="60" cy="60" r="55" fill="none" stroke={ringAccent} strokeOpacity="0.28" strokeWidth="1" />
            <circle cx="60" cy="60" r="37" fill="none" stroke="#94a3b8" strokeOpacity="0.16" strokeWidth="0.8" strokeDasharray="3 3" />
            <circle cx="60" cy="60" r="19" fill="none" stroke="#94a3b8" strokeOpacity="0.16" strokeWidth="0.8" />
            <line x1="60" y1="5" x2="60" y2="115" stroke="#94a3b8" strokeOpacity="0.14" strokeWidth="0.8" />
            <line x1="5" y1="68" x2="115" y2="68" stroke="#94a3b8" strokeOpacity="0.14" strokeWidth="0.8" />

            <g clipPath="url(#minimapClip)">
              {/* Current Zone Curved Anatomical Corridor Layout */}
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

              {/* Target Organ Waypoint Marker */}
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

            {/* 6-Organ Journey Waypoint Arc at Bottom Rim (Mulut -> Darah -> Saraf -> Jantung -> Usus -> Anus) */}
            {([0, 1, 2, 3, 4, 5] as const).map((idx) => {
              const angle = (Math.PI * 0.76) - (idx / 5) * (Math.PI * 0.52);
              const ox = 60 + Math.cos(angle) * 51;
              const oy = 60 + Math.sin(angle) * 51;
              const passedOrCurrent = idx <= hud.zoneIndex;
              const isCurrent = idx === hud.zoneIndex;
              return (
                <circle
                  key={idx}
                  cx={ox}
                  cy={oy}
                  r={isCurrent ? 3.0 : 2.0}
                  fill={isCurrent ? '#22d3ee' : passedOrCurrent ? '#34d399' : '#475569'}
                  stroke="#070c16"
                  strokeWidth="0.8"
                />
              );
            })}
          </svg>
        </div>

        {/* Compact Organ Target Distance Readout */}
        <div
          className="rounded-md border border-slate-700/70 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-200 tabular-nums"
          style={{ backgroundColor: 'rgba(6, 12, 24, 0.72)' }}
        >
          {hud.minimap.nextOrganLabel} · {hud.minimap.nextOrganDistance}m
        </div>
      </div>

      {/* Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 transition-transform duration-200 md:left-[calc(50%-72px)] ${
          dockCollapsed ? 'translate-y-[calc(100%-26px)]' : 'translate-y-0'
        }`}
        style={{ width: 'min(640px, calc(100vw - 32px))' }}
      >
        {/* Collapse / Expand Handle */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setDockCollapsed((v) => !v)}
            className="pointer-events-auto flex cursor-pointer items-center gap-1.5 rounded-t-lg border border-b-0 border-cyan-500/30 px-3.5 py-1 text-[11px] font-semibold text-cyan-200"
            style={{ backgroundColor: 'rgba(7, 13, 24, 0.88)' }}
          >
            {dockCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            <span>{dockCollapsed ? 'Tampilkan Kontrol (H)' : 'Sembunyikan HUD (H)'}</span>
          </button>
        </div>

        <div
          className="pointer-events-auto flex flex-col gap-2 rounded-xl border border-cyan-500/30 px-4 py-2.5 shadow-xl"
          style={{ backgroundColor: 'rgba(7, 13, 24, 0.86)' }}
        >
          {/* B.I.O.-7 Assistant Comms Strip */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-700/60 pb-2 text-xs">
            <span className="truncate font-medium text-amber-200">{hud.bioMessage}</span>
            <div className="flex shrink-0 items-center gap-3 text-[11px] font-semibold">
              <span className={hud.bioAssistReady ? 'text-cyan-300' : 'text-slate-500'}>
                [F] B.I.O.-7 {hud.bioAssistReady ? 'SIAP' : 'ISI'}
              </span>
              <span className={hud.boostCooldown <= 0 ? 'text-emerald-300' : 'text-slate-500'}>
                [Spasi] Boost {hud.boostCooldown <= 0 ? 'SIAP' : `${hud.boostCooldown}s`}
              </span>
            </div>
          </div>

          {/* 3 Special Weapon Selector Tabs */}
          <div className="grid grid-cols-3 gap-2">
            {([1, 2, 3] as WeaponId[]).map((id) => {
              const w = WEAPONS[id];
              const active = hud.activeWeapon === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectWeapon(id)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-1.5 text-left transition-colors ${
                    active ? 'border-cyan-400/80 text-white' : 'border-slate-700/70 text-slate-400 hover:text-slate-200'
                  }`}
                  style={{
                    backgroundColor: active ? 'rgba(14, 116, 144, 0.35)' : 'rgba(15, 23, 42, 0.55)',
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: w.color }}
                    />
                    <span className="truncate text-xs font-bold">{w.shortName}</span>
                  </div>
                  <kbd className="ml-2 rounded border border-slate-600 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
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

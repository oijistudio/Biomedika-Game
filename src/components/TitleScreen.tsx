import React from 'react';
import { FastForward, Play, Sparkles, Trophy, Volume2, VolumeX } from 'lucide-react';
import { SavedProgress } from '../game/storage';
import { ZONES, ZoneIndex } from '../game/types';

interface TitleScreenProps {
  onStart: (startZone?: ZoneIndex) => void;
  rayTracingEnabled: boolean;
  onToggleRayTracing: () => void;
  muted: boolean;
  onToggleMute: () => void;
  savedProgress: SavedProgress;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  rayTracingEnabled,
  onToggleRayTracing,
  muted,
  onToggleMute,
  savedProgress,
}) => {
  const hasSavedRecord = savedProgress.bestScore > 0 || savedProgress.totalKills > 0;
  const highestZone = savedProgress.highestZoneReached;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-6 md:p-10">
      {/* Top Bar: Static Audio & Ray Tracing Switch */}
      <div className="flex items-center justify-between">
        <div
          className="pointer-events-auto flex items-center gap-2.5 rounded-lg border border-cyan-400/30 px-3.5 py-2 text-xs font-semibold tracking-wider text-cyan-200 uppercase"
          style={{ backgroundColor: 'rgba(8, 15, 28, 0.82)' }}
        >
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>WebGL2 PBR · Fisika Fluida · Ray Tracing</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleRayTracing}
            className={`cursor-pointer rounded-lg border px-3.5 py-2 text-xs font-semibold tracking-wide transition-colors ${
              rayTracingEnabled
                ? 'border-cyan-400/60 text-cyan-200'
                : 'border-slate-600/60 text-slate-300'
            }`}
            style={{ backgroundColor: 'rgba(8, 15, 28, 0.85)' }}
          >
            Ray Tracing: {rayTracingEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Aktifkan Suara' : 'Matikan Suara'}
            className="cursor-pointer rounded-lg border border-slate-600/60 p-2 text-slate-200 transition-colors hover:border-cyan-400/60 hover:text-cyan-200"
            style={{ backgroundColor: 'rgba(8, 15, 28, 0.85)' }}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Hero Lockup over Calm Left Negative Space (3D Pod & Oral Gate showcased on right/center) */}
      <div className="my-auto max-w-xl">
        <div
          className="pointer-events-auto rounded-2xl border border-cyan-500/25 p-6 md:p-8 shadow-2xl"
          style={{ backgroundColor: 'rgba(7, 12, 22, 0.78)' }}
        >
          {/* Bespoke Inline SVG Title Lockup */}
          <svg
            viewBox="0 0 460 112"
            className="mb-4 h-24 w-full max-w-[420px]"
            role="img"
            aria-label="Nano-Medika: Ekspedisi Mikro"
          >
            <defs>
              <linearGradient id="nanoTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="55%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#fb7185" />
              </linearGradient>
            </defs>
            {/* Geometric Bio-Capsule Emblem */}
            <g transform="translate(8, 14)">
              <polygon
                points="32,2 60,18 60,50 32,66 4,50 4,18"
                fill="rgba(14, 116, 144, 0.28)"
                stroke="#22d3ee"
                strokeWidth="2.5"
              />
              <circle cx="32" cy="34" r="13" fill="none" stroke="#fb7185" strokeWidth="2.5" />
              <path d="M22 34 H42 M32 24 V44" stroke="#67e8f9" strokeWidth="2.5" strokeLinecap="round" />
            </g>
            <text
              x="84"
              y="48"
              fill="url(#nanoTitleGrad)"
              fontSize="36"
              fontWeight="800"
              letterSpacing="1.5"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              NANO-MEDIKA
            </text>
            <text
              x="86"
              y="76"
              fill="#e2e8f0"
              fontSize="16"
              fontWeight="600"
              letterSpacing="4.5"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              EKSPEDISI MIKRO 3D
            </text>
            <line x1="86" y1="90" x2="430" y2="90" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.5" />
          </svg>

          <p className="mb-5 text-sm leading-relaxed text-slate-200 md:text-base">
            Pandu kapal mikro <span className="font-semibold text-cyan-300">Profesor Aris</span> dan robot asisten{' '}
            <span className="font-semibold text-amber-300">B.I.O.-7</span> masuk dari{' '}
            <span className="text-rose-300">rongga mulut</span> ke aliran darah,{' '}
            <span className="text-indigo-300">sistem saraf pusat</span>,{' '}
            <span className="font-semibold text-rose-400">jantung</span>, lalu menembus{' '}
            <span className="text-amber-300">lorong pencernaan tak berujung</span> hingga keluar kembali ke laboratorium!
          </p>

          {hasSavedRecord && (
            <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-slate-700/75 bg-slate-900/70 px-4 py-2.5 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                <Trophy className="h-3.5 w-3.5" />
                Rekor: <strong className="tabular-nums">{savedProgress.bestScore.toLocaleString('id-ID')}</strong>
              </span>
              <span>
                Total Virus: <strong className="tabular-nums text-emerald-300">{savedProgress.totalKills}</strong>
              </span>
              <span>
                Zona Terbuka: <strong className="text-cyan-300">{ZONES[highestZone].name}</strong>
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onStart(0)}
              className="group flex cursor-pointer items-center gap-3 rounded-xl bg-cyan-400 px-7 py-3.5 text-sm font-extrabold tracking-wider text-slate-950 uppercase transition-transform hover:scale-[1.02] hover:bg-cyan-300 active:scale-[0.98]"
            >
              <Play className="h-4 w-4 fill-slate-950" />
              <span>Mulai Ekspedisi</span>
            </button>

            {highestZone > 0 && (
              <button
                type="button"
                onClick={() => onStart(highestZone)}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-950/50 px-4 py-3.5 text-xs font-bold tracking-wide text-emerald-200 uppercase transition-colors hover:border-emerald-300 hover:bg-emerald-900/60"
              >
                <FastForward className="h-4 w-4" />
                <span>Lanjut Zona {highestZone + 1}</span>
              </button>
            )}

            <span className="text-xs font-medium text-slate-400">
              Tekan <kbd className="rounded border border-slate-600 px-1.5 py-0.5 text-slate-200">Enter</kbd> untuk mulai
            </span>
          </div>
        </div>
      </div>

      {/* Single Flat Control-Hint Footer Line */}
      <div className="flex justify-center">
        <div
          className="rounded-lg border border-slate-700/70 px-5 py-2 text-center text-xs font-medium tracking-wide text-slate-300"
          style={{ backgroundColor: 'rgba(7, 12, 22, 0.82)' }}
        >
          WASD Gerak · Q/E Naik/Turun · Mouse Bidik &amp; Tembak · Spasi Boost · 1-3 Senjata · F B.I.O.-7 · R Ray Tracing · Ketik &quot;konami&quot; (↑↑↓↓←→←→BA) Tes Ending
        </div>
      </div>
    </div>
  );
};

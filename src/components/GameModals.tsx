import React from 'react';
import { HeartPulse, Play, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { SavedProgress } from '../game/storage';
import { HudSnapshot } from '../game/types';

interface GameModalsProps {
  hud: HudSnapshot;
  savedProgress: SavedProgress;
  onResume: () => void;
  onRestart: () => void;
  onToggleRayTracing: () => void;
  onOpenVictorySummary: () => void;
}

export const GameModals: React.FC<GameModalsProps> = ({
  hud,
  savedProgress,
  onResume,
  onRestart,
  onToggleRayTracing,
  onOpenVictorySummary,
}) => {
  // Unobstructed 3D Laboratory Ending Cutscene Overlay
  if (hud.phase === 'ending') {
    const stageLabel =
      hud.endingStage === 0
        ? 'Keluar Dari Tubuh · Ruang Re-Ekspansi'
        : hud.endingStage === 1
        ? 'Wujud Asli Kembali · Laboratorium'
        : 'Raka Sehat Total · Ending';

    return (
      <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-5 md:p-8">
        {/* Top Cinema Badge & Action */}
        <div className="flex items-center justify-between gap-3">
          <div
            className="rounded-lg border border-emerald-400/45 px-4 py-2 text-xs font-extrabold tracking-widest text-emerald-200 uppercase shadow-lg"
            style={{ backgroundColor: 'rgba(6, 14, 24, 0.84)' }}
          >
            {stageLabel}
          </div>

          <button
            type="button"
            onClick={onOpenVictorySummary}
            className={`pointer-events-auto cursor-pointer rounded-xl border px-4 py-2 text-xs font-extrabold tracking-wider uppercase shadow-lg transition-colors ${
              hud.endingReadyForSummary
                ? 'border-emerald-300 bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                : 'border-slate-500/70 text-slate-200 hover:border-cyan-300'
            }`}
            style={
              hud.endingReadyForSummary ? undefined : { backgroundColor: 'rgba(6, 14, 24, 0.84)' }
            }
          >
            {hud.endingReadyForSummary ? 'Lihat Hasil Misi →' : 'Lewati Adegan →'}
          </button>
        </div>

        {/* Bottom Cinema Subtitle Card (Center 3D Lab View Remains 100% Clear) */}
        <div className="mx-auto w-full max-w-2xl">
          <div
            className="pointer-events-auto rounded-2xl border border-cyan-400/35 px-6 py-4 text-center shadow-2xl"
            style={{ backgroundColor: 'rgba(6, 12, 22, 0.86)' }}
          >
            <p className="text-sm leading-relaxed font-medium text-slate-100 md:text-base">
              {hud.endingSubtitle}
            </p>
            {hud.endingReadyForSummary && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onOpenVictorySummary}
                  className="cursor-pointer rounded-xl bg-emerald-400 px-5 py-2 text-xs font-extrabold text-slate-950 uppercase hover:bg-emerald-300"
                >
                  Ringkasan &amp; Skor Akhir
                </button>
                <button
                  type="button"
                  onClick={onRestart}
                  className="cursor-pointer rounded-xl border border-slate-500 px-4 py-2 text-xs font-bold text-slate-200 uppercase hover:border-cyan-300"
                >
                  Main Lagi
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (hud.phase !== 'paused' && hud.phase !== 'victory' && hud.phase !== 'gameover') {
    return null;
  }

  const mins = Math.floor(hud.elapsedSeconds / 60);
  const secs = String(hud.elapsedSeconds % 60).padStart(2, '0');
  const zoneLabel =
    hud.zoneIndex === 0
      ? 'Rongga Mulut'
      : hud.zoneIndex === 1
      ? 'Aliran Darah'
      : hud.zoneIndex === 2
      ? 'Sistem Saraf Pusat'
      : hud.zoneIndex === 3
      ? 'Ruang Jantung'
      : hud.zoneIndex === 4
      ? 'Lorong Pencernaan Endless'
      : 'Gerbang Keluar Anus';

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(4, 8, 16, 0.72)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-cyan-500/35 p-7 text-slate-100 shadow-2xl"
        style={{ backgroundColor: 'rgba(8, 14, 26, 0.96)' }}
      >
        {hud.phase === 'paused' && (
          <>
            <h2 className="mb-1 text-2xl font-extrabold tracking-wide text-cyan-300 uppercase">
              Ekspedisi Dijeda
            </h2>
            <p className="mb-6 text-sm text-slate-300">
              Profesor Aris &amp; B.I.O.-7 menunggu perintah di dalam {zoneLabel}.
            </p>
            <div className="mb-6 flex items-center justify-between rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-3 text-sm">
              <span className="flex items-center gap-2 font-medium text-slate-200">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                Grafik Ray Tracing
              </span>
              <button
                type="button"
                onClick={onToggleRayTracing}
                className={`cursor-pointer rounded-lg border px-3 py-1 text-xs font-bold ${
                  hud.rayTracingEnabled
                    ? 'border-cyan-400/70 bg-cyan-500/20 text-cyan-200'
                    : 'border-slate-600 bg-slate-800 text-slate-400'
                }`}
              >
                {hud.rayTracingEnabled ? 'AKTIF' : 'NONAKTIF'}
              </button>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onResume}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3 text-sm font-extrabold text-slate-950 uppercase hover:bg-cyan-300"
              >
                <Play className="h-4 w-4 fill-slate-950" />
                <span>Lanjutkan</span>
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 py-3 text-sm font-bold text-slate-200 hover:border-slate-400"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Ulangi</span>
              </button>
            </div>
          </>
        )}

        {hud.phase === 'victory' && (
          <>
            <div className="mb-3 flex items-center gap-3 text-emerald-300">
              <Trophy className="h-7 w-7" />
              <h2 className="text-2xl font-extrabold tracking-wide uppercase">
                Raka Sembuh Total!
              </h2>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-slate-300">
              Profesor Aris dan B.I.O.-7 berhasil membasmi{' '}
              <span className="font-semibold text-rose-300">Chrono-Virus Omega</span>, menembus lorong
              pencernaan panjang hingga keluar kembali ke laboratorium, kembali ke wujud asli, dan menyaksikan
              Raka pulih 100%!
            </p>
            <div className="mb-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/75 p-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Skor Akhir</div>
                <div className="text-xl font-extrabold tabular-nums text-cyan-300">
                  {hud.score.toLocaleString('id-ID')}
                </div>
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/75 p-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Virus Dibasmi</div>
                <div className="text-xl font-extrabold tabular-nums text-emerald-300">{hud.kills}</div>
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/75 p-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Jarak Ditempuh</div>
                <div className="text-xl font-extrabold tabular-nums text-rose-300">
                  {hud.distanceMeters.toLocaleString('id-ID')}m
                </div>
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/75 p-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Waktu Misi</div>
                <div className="text-xl font-extrabold tabular-nums text-amber-300">
                  {mins}:{secs}
                </div>
              </div>
            </div>
            <div className="mb-6 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-950/30 px-3.5 py-2 text-xs text-amber-200">
              <span>Rekor Terbaik Tersimpan</span>
              <strong className="tabular-nums">{savedProgress.bestScore.toLocaleString('id-ID')}</strong>
            </div>
            <button
              type="button"
              onClick={onRestart}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3.5 text-sm font-extrabold text-slate-950 uppercase hover:bg-emerald-300"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Mainkan Ekspedisi Lagi</span>
            </button>
          </>
        )}

        {hud.phase === 'gameover' && (
          <>
            <div className="mb-3 flex items-center gap-3 text-rose-400">
              <HeartPulse className="h-7 w-7" />
              <h2 className="text-2xl font-extrabold tracking-wide uppercase">
                Integritas Pod Kritis
              </h2>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-slate-300">
              Kapal mikro mengalami kerusakan parah sebelum mencapai gerbang keluar. B.I.O.-7 telah menarik Profesor Aris kembali ke titik aman.
            </p>
            <div className="mb-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/75 p-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Skor</div>
                <div className="text-xl font-extrabold tabular-nums text-cyan-300">
                  {hud.score.toLocaleString('id-ID')}
                </div>
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/75 p-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Virus Dibasmi</div>
                <div className="text-xl font-extrabold tabular-nums text-emerald-300">{hud.kills}</div>
              </div>
            </div>
            <div className="mb-6 flex items-center justify-between rounded-lg border border-slate-700/70 bg-slate-900/75 px-3.5 py-2 text-xs text-slate-300">
              <span>Rekor Terbaik Tersimpan</span>
              <strong className="tabular-nums text-amber-300">{savedProgress.bestScore.toLocaleString('id-ID')}</strong>
            </div>
            <button
              type="button"
              onClick={onRestart}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-500 py-3.5 text-sm font-extrabold text-white uppercase hover:bg-rose-400"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Coba Ekspedisi Lagi</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

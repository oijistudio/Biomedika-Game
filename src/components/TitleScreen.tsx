import React from 'react';
import {
  ChevronDown,
  FastForward,
  Gamepad2,
  GitBranch,
  HeartPulse,
  Play,
  Shield,
  Smartphone,
  Sparkles,
  Trophy,
  Vibrate,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { SavedProgress } from '../game/storage';
import { WEAPONS, WeaponId, ZONES, ZoneIndex } from '../game/types';
import previewLabImg from '../assets/images/preview_lab_shrink_1795431848579.jpg';
import previewBloodImg from '../assets/images/preview_blood_artery_1795431848071.jpg';
import previewCnsImg from '../assets/images/preview_cns_synapse_1795431847340.jpg';
import previewHeartImg from '../assets/images/preview_heart_boss_1795431847618.jpg';

interface TitleScreenProps {
  onStart: (startZone?: ZoneIndex) => void;
  rayTracingEnabled: boolean;
  onToggleRayTracing: () => void;
  muted: boolean;
  onToggleMute: () => void;
  savedProgress: SavedProgress;
}

const PREVIEW_GALLERY = [
  {
    src: previewLabImg,
    alt: 'Laboratorium Profesor Aris & Sinar Pengecil Kuantum',
    tag: 'Adegan Pembuka & Akhir',
    title: 'Laboratorium Klinis & Sinar Kuantum',
    desc: 'Profesor Aris bersama asisten robot B.I.O.-7 mempersiapkan pesawat mikro Nano-Pod di samping ranjang Raka sebelum menyusut memasuki tubuhnya.',
  },
  {
    src: previewBloodImg,
    alt: 'Kapal Nano-Pod melesat di Aliran Darah Arteri bercabang',
    tag: 'Zona 3 · Aliran Darah',
    title: 'Lorong Arteri & Cabang Kapiler',
    desc: 'Terobos derasnya arus sel darah merah dengan fisika fluida realistis serta puluhan cabang saluran bronkus, arteri, dan pembuluh mikro.',
  },
  {
    src: previewCnsImg,
    alt: 'Sistem Saraf Pusat dan Sinapsis Bio-Listrik',
    tag: 'Zona 4 · Sistem Saraf Pusat',
    title: 'Labirin Neuron & Impuls Sinapsis',
    desc: 'Pantulan Ray Tracing menyoroti jalinan mielin saraf pusat sambil melumpuhkan Neuro-Parasit Vektor yang menghalangi jalur ke jantung.',
  },
  {
    src: previewHeartImg,
    alt: 'Pertempuran Boss Chrono-Virus Omega di Ruang Jantung',
    tag: 'Zona 5 · Pertarungan Boss',
    title: 'Ruang Miokardium Jantung & Chrono-Virus',
    desc: 'Runtuhkan 3 Nodus Perisai Kuning lalu hancurkan inti Chrono-Virus Omega sebelum meluncur menembus organ pencernaan super panjang!',
  },
];

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

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative z-20 flex flex-col text-slate-100">
      {/* =========================================================
          TOP SECTION (100vh): Live 3D Laboratory Main Menu
         ========================================================= */}
      <section className="pointer-events-none relative flex min-h-screen flex-col justify-between p-4 sm:p-6 md:p-10">
        {/* Clean 3-Zone Header */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="pointer-events-auto flex items-center gap-2.5 rounded-lg border border-cyan-400/35 px-3.5 py-2 text-[11px] font-bold tracking-wider text-cyan-200 uppercase sm:text-xs"
            style={{ backgroundColor: 'rgba(6, 12, 24, 0.86)' }}
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Laboratorium Klinis · Ray Tracing 3D</span>
          </div>

          <nav
            className="pointer-events-auto hidden items-center gap-6 rounded-lg border border-slate-700/70 px-5 py-2 text-xs font-semibold text-slate-200 lg:flex"
            style={{ backgroundColor: 'rgba(6, 12, 24, 0.86)' }}
          >
            <button
              type="button"
              onClick={() => scrollToSection('preview-section')}
              className="cursor-pointer transition-colors hover:text-cyan-300"
            >
              Foto Preview
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('story-weapons-section')}
              className="cursor-pointer transition-colors hover:text-cyan-300"
            >
              Cerita &amp; Senjata
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('zones-section')}
              className="cursor-pointer transition-colors hover:text-cyan-300"
            >
              10 Zona Organ
            </button>
          </nav>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleRayTracing}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-bold tracking-wide transition-colors ${
                rayTracingEnabled
                  ? 'border-cyan-400/70 text-cyan-200'
                  : 'border-slate-600/70 text-slate-300'
              }`}
              style={{ backgroundColor: 'rgba(6, 12, 24, 0.88)' }}
            >
              RT: {rayTracingEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Aktifkan Suara' : 'Matikan Suara'}
              className="cursor-pointer rounded-lg border border-slate-600/70 p-2 text-slate-200 transition-colors hover:border-cyan-400/70 hover:text-cyan-200"
              style={{ backgroundColor: 'rgba(6, 12, 24, 0.88)' }}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Left Hero Card leaving 3D Lab, Profesor Aris, Pod & Sick Raka visible on right */}
        <div className="my-auto max-w-xl py-4">
          <div
            className="pointer-events-auto rounded-2xl border border-cyan-500/30 p-5 shadow-2xl sm:p-7"
            style={{ backgroundColor: 'rgba(6, 12, 24, 0.84)' }}
          >
            <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-rose-400/40 bg-rose-950/50 px-2.5 py-1 text-[11px] font-bold tracking-wider text-rose-200 uppercase">
              <HeartPulse className="h-3.5 w-3.5 text-rose-400" />
              <span>Darurat Medis · Selamatkan Raka</span>
            </div>

            <h1 className="font-display mb-2 bg-gradient-to-r from-cyan-300 via-sky-300 to-rose-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-5xl">
              NANO-MEDIKA
            </h1>
            <p className="font-display mb-4 text-xs font-bold tracking-[0.28em] text-slate-300 uppercase sm:text-sm">
              Ekspedisi Mikro 3D · 10 Zona Anatomi
            </p>

            <p className="mb-5 text-sm leading-relaxed text-slate-200 sm:text-base">
              Cucu tercinta <span className="font-semibold text-rose-300">Raka</span> terbaring sakit oleh
              patogen misterius. Bimbing <span className="font-semibold text-cyan-300">Profesor Aris</span> dan
              robot <span className="font-semibold text-amber-300">B.I.O.-7</span> masuk melalui mulut,
              menjelajahi puluhan lorong cabang organ tubuh sepanjang{' '}
              <span className="font-semibold text-emerald-300">6.200+ meter mikro</span>!
            </p>

            {hasSavedRecord && (
              <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/75 px-3.5 py-2.5 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                  <Trophy className="h-3.5 w-3.5" />
                  Rekor: <strong className="tabular-nums">{savedProgress.bestScore.toLocaleString('id-ID')}</strong>
                </span>
                <span>
                  Virus: <strong className="tabular-nums text-emerald-300">{savedProgress.totalKills}</strong>
                </span>
                <span className="truncate">
                  Terbuka: <strong className="text-cyan-300">{ZONES[highestZone].name}</strong>
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onStart(0)}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-extrabold tracking-wider text-slate-950 uppercase transition-transform hover:scale-[1.02] hover:bg-cyan-300 active:scale-[0.98]"
              >
                <Play className="h-4 w-4 fill-slate-950" />
                <span>Mulai Ekspedisi</span>
              </button>

              {highestZone > 0 && (
                <button
                  type="button"
                  onClick={() => onStart(highestZone)}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-950/60 px-4 py-3.5 text-xs font-bold tracking-wide text-emerald-200 uppercase transition-colors hover:border-emerald-300 hover:bg-emerald-900/70"
                >
                  <FastForward className="h-4 w-4" />
                  <span>Lanjut Zona {highestZone + 1}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => scrollToSection('preview-section')}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-600/80 bg-slate-900/70 px-4 py-3.5 text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-400/60 hover:text-cyan-200"
              >
                <span>Lihat Preview</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Scroll Invitation Bar */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => scrollToSection('preview-section')}
            className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700/80 px-4 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-400/60 hover:text-cyan-300"
            style={{ backgroundColor: 'rgba(6, 12, 24, 0.86)' }}
          >
            <span>Gulir ke bawah untuk foto preview, penjelasan cerita &amp; peta 10 organ</span>
            <ChevronDown className="h-4 w-4 text-cyan-400" />
          </button>
        </div>
      </section>

      {/* =========================================================
          SCROLLABLE GAME SHOWCASE WEBSITE BELOW THE FOLD
         ========================================================= */}
      <div className="border-t border-cyan-500/25 bg-[#060b14]">
        {/* Section 1: Photo Preview Gallery */}
        <section id="preview-section" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-xs font-bold tracking-[0.22em] text-cyan-400 uppercase">
                Dokumentasi Ekspedisi Mikro
              </p>
              <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
                Foto Preview Dunia &amp; Adegan Game
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-400">
              Visual 3D PBR dengan pencahayaan volumetrik, pantulan Ray Tracing aktif, fisika aliran darah,
              serta animasi pembuka dan penutup di laboratorium Profesor Aris.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {PREVIEW_GALLERY.map((item) => (
              <article
                key={item.title}
                className="group overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1322] transition-colors hover:border-cyan-500/45"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                  <img
                    src={item.src}
                    alt={item.alt}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-5 sm:p-6">
                  <div className="mb-1.5 text-[11px] font-bold tracking-widest text-cyan-300 uppercase">
                    {item.tag}
                  </div>
                  <h3 className="font-display mb-2 text-lg font-bold text-white sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-400">{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Section 2: Story, Special Weapons & Mobile Haptics */}
        <section
          id="story-weapons-section"
          className="border-y border-slate-800/90 bg-[#09111f] px-5 py-16 sm:px-8 sm:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-6">
                <p className="mb-2 text-xs font-bold tracking-[0.22em] text-rose-400 uppercase">
                  Alur Cerita Pembuka &amp; Misi
                </p>
                <h2 className="font-display mb-4 text-3xl font-extrabold text-white sm:text-4xl">
                  Menyusut ke Skala Nano Demi Kesembuhan Sang Cucu
                </h2>
                <p className="mb-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                  Saat antibiotik biasa gagal melawan mutasi <span className="text-rose-300 font-semibold">Chrono-Virus Omega</span>,
                  Profesor Aris mengaktifkan mesin pengecil kuantum di laboratorium pribadinya. Begitu tombol mulai ditekan,
                  Anda akan menyaksikan adegan sinematik ketika Raka terbaring di ranjang lab, lalu Profesor masuk ke pesawat
                  tembak Nano-Pod, menyusut, dan melesat masuk ke mulut Raka bersama drone medis B.I.O.-7.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-[#0d172a] p-4">
                    <div className="mb-1.5 flex items-center gap-2 text-sm font-bold text-cyan-300">
                      <GitBranch className="h-4 w-4" />
                      <span>Lorong Bercabang 3D</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400">
                      Belok ke jalur kiri atau kanan mengitari pilar persimpangan bronkus, pembuluh portal, nefron ginjal, dan lipatan usus.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-[#0d172a] p-4">
                    <div className="mb-1.5 flex items-center gap-2 text-sm font-bold text-emerald-300">
                      <Vibrate className="h-4 w-4" />
                      <span>Haptic Feedback Mobile</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400">
                      Getaran perangkat aktif (Vibration API) saat menembak, mengenai dinding/pilar cabang, boost, hingga boss tumbang.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Special Weapons Showcase */}
              <div className="flex flex-col gap-3.5 lg:col-span-6">
                {([1, 2, 3] as WeaponId[]).map((id) => {
                  const w = WEAPONS[id];
                  return (
                    <div
                      key={id}
                      className="flex items-start gap-4 rounded-xl border border-slate-800 bg-[#0d172a] p-4"
                    >
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-sm font-extrabold"
                        style={{
                          borderColor: `${w.color}66`,
                          backgroundColor: `${w.color}18`,
                          color: w.color,
                        }}
                      >
                        {w.key}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-display text-base font-bold text-white">{w.name}</h3>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {w.energyCost === 0 ? 'Energi Gratis' : `Energi ${w.energyCost}`}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-400">{w.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dual Control Scheme: Desktop & Mobile */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-start gap-4 rounded-2xl border border-slate-800 bg-[#0d172a] p-5">
                <Gamepad2 className="mt-0.5 h-6 w-6 shrink-0 text-cyan-400" />
                <div>
                  <h3 className="font-display mb-1 text-base font-bold text-white">
                    Kontrol Desktop (Keyboard &amp; Mouse)
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-400">
                    WASD / Panah atau Scroll Mouse untuk maju-mundur · Q/E naik turun · Mouse bidik &amp; klik kiri tembak · Klik kanan atau 1-3 ganti senjata · Spasi Boost · F bantuan B.I.O.-7 · R Ray Tracing.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-2xl border border-slate-800 bg-[#0d172a] p-5">
                <Smartphone className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
                <div>
                  <h3 className="font-display mb-1 text-base font-bold text-white">
                    Kontrol Mobile + Joystick &amp; Getaran Haptik
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-400">
                    Joystick analog kiri untuk manuver bebas, tombol sentuh Tembak, Boost &amp; B.I.O.-7 di kanan, serta sakelar Haptic Feedback langsung di HUD.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: All 10 Anatomical Organ Zones + Final CTA */}
        <section id="zones-section" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-xs font-bold tracking-[0.22em] text-emerald-400 uppercase">
                Rute Ekspedisi Super Panjang
              </p>
              <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
                10 Zona Organ Tubuh Hingga Gerbang Keluar
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-cyan-400" />
                42 Persimpangan Multi-Jalur
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-400" />
                71 Lorong Cabang
              </span>
            </div>
          </div>

          <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {ZONES.map((z) => (
              <div
                key={z.index}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0b1322] p-4"
              >
                <div>
                  <div className="mb-1 text-[11px] font-bold tracking-wider text-cyan-300 uppercase">
                    {z.subtitle}
                  </div>
                  <h3 className="font-display mb-2 text-sm font-bold text-white">{z.name}</h3>
                  <p className="text-xs leading-relaxed text-slate-400">{z.objectiveText}</p>
                </div>
                <div className="mt-3 border-t border-slate-800 pt-2 text-[11px] font-medium tabular-nums text-slate-500">
                  Jarak {Math.abs(z.zEnd)}m
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-cyan-500/30 bg-[#0b1628] p-7 text-center md:flex-row md:text-left">
            <div>
              <h3 className="font-display mb-1 text-2xl font-extrabold text-white">
                Siap Memasuki Tubuh Raka Bersama Profesor Aris?
              </h3>
              <p className="text-sm text-slate-300">
                Tekan tombol di samping untuk memutar adegan intro laboratorium dan memulai petualangan mikro!
              </p>
            </div>
            <button
              type="button"
              onClick={() => onStart(0)}
              className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl bg-cyan-400 px-7 py-4 text-sm font-extrabold tracking-wider text-slate-950 uppercase transition-transform hover:scale-[1.03] hover:bg-cyan-300"
            >
              <Play className="h-4 w-4 fill-slate-950" />
              <span>Mulai Ekspedisi Sekarang</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

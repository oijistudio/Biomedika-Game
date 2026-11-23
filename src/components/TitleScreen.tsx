import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  FastForward,
  Gamepad2,
  Play,
  Share2,
  Smartphone,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SavedProgress } from '../game/storage';
import { WEAPONS, WeaponId, ZONES, ZoneIndex } from '../game/types';
import { BioBackgroundEffects } from './BioBackgroundEffects';
import previewLabImg from '../assets/images/preview_lab_shrink_1795431848579.jpg';
import previewBloodImg from '../assets/images/preview_blood_artery_1795431848071.jpg';
import previewCnsImg from '../assets/images/preview_cns_synapse_1795431847340.jpg';
import previewHeartImg from '../assets/images/preview_heart_boss_1795431847618.jpg';
import ogPreviewImg from '../assets/images/og_preview_banner_1795434605072.jpg';
import tabIconImg from '../assets/images/tab_app_icon_1795434602787.jpg';

interface TitleScreenProps {
  onStart: (startZone?: ZoneIndex) => void;
  rayTracingEnabled: boolean;
  onToggleRayTracing: () => void;
  muted: boolean;
  onToggleMute: () => void;
  savedProgress: SavedProgress;
}

type GalleryFilter = 'all' | 'scenes' | 'opengraph';

const PREVIEW_GALLERY = [
  {
    id: '01',
    src: previewLabImg,
    alt: 'Laboratorium Profesor Aris & Sinar Pengecil Kuantum',
    meta: '01 · Adegan Pembuka & Penutup',
    title: 'Laboratorium Klinis & Sinar Kuantum',
    desc: 'Profesor Aris dan drone B.I.O.-7 mempersiapkan pesawat Nano-Pod di sisi ranjang Raka sebelum menyusut memasuki tubuhnya.',
  },
  {
    id: '02',
    src: previewBloodImg,
    alt: 'Kapal Nano-Pod melesat di Aliran Darah Arteri bercabang',
    meta: '02 · Zona 3 · Aliran Darah',
    title: 'Lorong Arteri & Cabang Kapiler',
    desc: 'Terobos derasnya arus sel darah merah dengan fisika fluida realistis serta puluhan cabang saluran bronkus dan pembuluh mikro.',
  },
  {
    id: '03',
    src: previewCnsImg,
    alt: 'Sistem Saraf Pusat dan Sinapsis Bio-Listrik',
    meta: '03 · Zona 4 · Sistem Saraf Pusat',
    title: 'Labirin Neuron & Impuls Sinapsis',
    desc: 'Pantulan Ray Tracing menyoroti jalinan mielin saraf pusat sambil melumpuhkan Neuro-Parasit yang menghalangi jalur menuju jantung.',
  },
  {
    id: '04',
    src: previewHeartImg,
    alt: 'Pertempuran Boss Chrono-Virus Omega di Ruang Jantung',
    meta: '04 · Zona 5 · Pertarungan Boss',
    title: 'Ruang Miokardium & Chrono-Virus Omega',
    desc: 'Runtuhkan 3 nodus perisai pelindung lalu hancurkan inti Chrono-Virus sebelum menembus organ pencernaan hingga gerbang keluar.',
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
  const [galleryFilter, setGalleryFilter] = useState<GalleryFilter>('all');
  const [brokenIds, setBrokenIds] = useState<Record<string, boolean>>({});
  const hasSavedRecord = savedProgress.bestScore > 0 || savedProgress.totalKills > 0;
  const highestZone = savedProgress.highestZoneReached;

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const markBroken = (key: string) => {
    setBrokenIds((prev) => ({ ...prev, [key]: true }));
  };

  return (
    <div className="relative z-10 flex flex-col text-slate-900">
      {/* Subtle White-Canvas Biological Cellular & Synaptic Backdrop */}
      <BioBackgroundEffects />

      {/* =========================================================
          TOP BAR CONTRACT (3-Zone Clean White Header)
         ========================================================= */}
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-5 sm:px-8">
          {/* Zone 1: Single Clean Brand Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="font-display shrink-0 text-lg font-bold tracking-tight whitespace-nowrap text-slate-950"
          >
            Nano-Medika
          </a>

          {/* Zone 2: 4 Concise Single-Line Navigation Links */}
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <button
              type="button"
              onClick={() => scrollToSection('preview-section')}
              className="shrink-0 cursor-pointer whitespace-nowrap underline-offset-4 transition-colors hover:text-slate-950 hover:underline"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('story-weapons-section')}
              className="shrink-0 cursor-pointer whitespace-nowrap underline-offset-4 transition-colors hover:text-slate-950 hover:underline"
            >
              Cerita
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('weapons-list')}
              className="shrink-0 cursor-pointer whitespace-nowrap underline-offset-4 transition-colors hover:text-slate-950 hover:underline"
            >
              Senjata
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('zones-section')}
              className="shrink-0 cursor-pointer whitespace-nowrap underline-offset-4 transition-colors hover:text-slate-950 hover:underline"
            >
              Zona Organ
            </button>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => onStart(0)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-xs font-semibold whitespace-nowrap text-white transition-colors hover:bg-cyan-800"
            >
              <span>Mulai Ekspedisi</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          HERO SECTION: White Minimalist Editorial + Live 3D Lab
         ========================================================= */}
      <section
        id="top"
        className="relative z-0 flex min-h-[calc(100vh-4rem)] flex-col justify-between overflow-hidden"
      >
        {/* Crisp White Clinical Scrim fading cleanly onto the Live 3D Lab on the right */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-white/95 via-white/75 to-white lg:bg-gradient-to-r lg:from-white lg:via-white/94 lg:to-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-32 bg-gradient-to-t from-white via-white/85 to-transparent"
        />

        {/* Delicate DNA Double-Helix Biological Line Accent along left white margin */}
        <svg
          aria-hidden="true"
          viewBox="0 0 80 320"
          className="bio-helix-drift pointer-events-none absolute top-14 left-3 z-0 hidden h-72 w-16 text-cyan-700/15 xl:block"
          fill="none"
        >
          <path
            d="M16 12 C64 44, 64 76, 16 108 C-16 140, 64 172, 16 204 C-16 236, 64 268, 16 300"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M64 12 C16 44, 16 76, 64 108 C96 140, 16 172, 64 204 C96 236, 16 268, 64 300"
            stroke="#0d9488"
            strokeOpacity="0.45"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {[32, 60, 88, 128, 156, 184, 224, 252, 280].map((y) => (
            <line
              key={y}
              x1="22"
              y1={y}
              x2="58"
              y2={y}
              stroke="currentColor"
              strokeWidth="1.4"
              strokeDasharray="3 3"
            />
          ))}
        </svg>

        <div className="relative z-20 mx-auto my-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-5 py-10 sm:px-8 lg:grid-cols-12 lg:py-14">
          {/* Left Editorial Content Column */}
          <div className="lg:col-span-7">
            <p className="mb-3 text-xs font-medium tracking-wide text-cyan-800">
              Ekspedisi Anatomi 3D · Fisika Fluida &amp; Ray Tracing
            </p>

            <h1
              className="font-display mb-4 max-w-2xl font-bold tracking-tight text-slate-950"
              style={{ fontSize: 'clamp(2.25rem, 4.3vw, 3.65rem)', lineHeight: 1.08, textWrap: 'balance' }}
            >
              Jelajahi Tubuh Manusia dalam Skala Nano.
            </h1>

            <p className="mb-6 max-w-xl text-base leading-relaxed text-slate-600">
              Bantu <span className="font-semibold text-slate-900">Profesor Aris</span> dan drone{' '}
              <span className="font-semibold text-slate-900">B.I.O.-7</span> menyusut ke dalam tubuh cucunya,{' '}
              <span className="font-semibold text-rose-700">Raka</span>. Telusuri mulut, aliran darah,
              sistem saraf pusat, hingga jantung untuk menumpas virus misterius.
            </p>

            {/* Saved Progress Hairline Readout (only when player has saved history) */}
            {hasSavedRecord && (
              <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-y border-slate-200 py-2.5 text-xs text-slate-600">
                <span>
                  Rekor Terbaik{' '}
                  <strong className="font-mono font-semibold tabular-nums text-slate-950">
                    {savedProgress.bestScore.toLocaleString('id-ID')}
                  </strong>
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span>
                  Patogen Basmi{' '}
                  <strong className="font-mono font-semibold tabular-nums text-cyan-800">
                    {savedProgress.totalKills}
                  </strong>
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span className="truncate">
                  Progres: <strong className="font-semibold text-slate-900">{ZONES[highestZone].name}</strong>
                </span>
              </div>
            )}

            {/* Primary CTA + Secondary Resume & Inline Lab Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onStart(0)}
                className="inline-flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg bg-cyan-700 px-6 py-3 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-cyan-800"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Mulai Ekspedisi</span>
              </button>

              {highestZone > 0 && (
                <button
                  type="button"
                  onClick={() => onStart(highestZone)}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-xs font-semibold whitespace-nowrap text-slate-800 transition-colors hover:border-cyan-700 hover:text-cyan-800"
                >
                  <FastForward className="h-4 w-4 text-cyan-700" />
                  <span>Lanjut Zona {highestZone + 1}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => scrollToSection('preview-section')}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-medium whitespace-nowrap text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
              >
                <span>Lihat Preview</span>
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Clean Inline Utility Toggles (outside Header to honor 3-Zone Top Bar) */}
            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <button
                type="button"
                onClick={onToggleRayTracing}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-medium whitespace-nowrap text-slate-700 transition-colors hover:border-cyan-600 hover:text-cyan-800"
              >
                <span className="font-mono text-[11px] font-semibold text-cyan-700">
                  {rayTracingEnabled ? 'RT ON' : 'RT OFF'}
                </span>
                <span>Pantulan Ray Tracing</span>
              </button>

              <button
                type="button"
                onClick={onToggleMute}
                aria-label={muted ? 'Aktifkan Suara' : 'Matikan Suara'}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-medium whitespace-nowrap text-slate-700 transition-colors hover:border-cyan-600 hover:text-cyan-800"
              >
                {muted ? <VolumeX className="h-3.5 w-3.5 text-slate-500" /> : <Volume2 className="h-3.5 w-3.5 text-cyan-700" />}
                <span>{muted ? 'Audio Senyap' : 'Audio Aktif'}</span>
              </button>
            </div>
          </div>

          {/* Right Transparent Clinical Observation Window framing Live 3D Lab */}
          <div className="hidden lg:col-span-5 lg:flex lg:flex-col lg:items-end lg:justify-end">
            <div className="pointer-events-none relative aspect-[4/3] w-full rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="absolute right-3 bottom-3 rounded-md border border-slate-200/90 bg-white/92 px-3 py-1.5 text-[11px] font-medium text-slate-700">
                Laboratorium 3D · Profesor Aris, B.I.O.-7 &amp; Raka
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Quantitative Expedition Strip below Hero */}
        <div className="relative z-20 border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-4 sm:divide-y-0">
            <div className="px-5 py-4 sm:px-8">
              <div className="text-xs text-slate-500">Rute Anatomi</div>
              <div className="font-mono mt-0.5 text-xl font-semibold tabular-nums text-slate-950">
                10 <span className="text-xs font-normal text-slate-500">zona organ</span>
              </div>
            </div>
            <div className="px-5 py-4 sm:px-8">
              <div className="text-xs text-slate-500">Panjang Lintasan</div>
              <div className="font-mono mt-0.5 text-xl font-semibold tabular-nums text-slate-950">
                6.200+ <span className="text-xs font-normal text-slate-500">meter mikro</span>
              </div>
            </div>
            <div className="px-5 py-4 sm:px-8">
              <div className="text-xs text-slate-500">Simpang Multi-Jalur</div>
              <div className="font-mono mt-0.5 text-xl font-semibold tabular-nums text-slate-950">
                42 <span className="text-xs font-normal text-slate-500">percabangan</span>
              </div>
            </div>
            <div className="px-5 py-4 sm:px-8">
              <div className="text-xs text-slate-500">Saluran Pembuluh</div>
              <div className="font-mono mt-0.5 text-xl font-semibold tabular-nums text-slate-950">
                71 <span className="text-xs font-normal text-slate-500">lorong cabang</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 1: GALLERY PREVIEW & OPENGRAPH CARD SHOWCASE
         ========================================================= */}
      <section id="preview-section" className="relative z-0 bg-white py-16 sm:py-24">
        <div className="relative z-20 mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mb-10 flex flex-col justify-between gap-6 border-b border-slate-200 pb-6 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-cyan-800">
                Dokumentasi &amp; Identitas Visual
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Pratinjau Dunia 3D &amp; Kartu OpenGraph
              </h2>
            </div>

            {/* Functional Segmented Filter */}
            <div className="inline-flex w-fit items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {(
                [
                  { id: 'all', label: 'Semua' },
                  { id: 'scenes', label: 'Adegan 3D' },
                  { id: 'opengraph', label: 'OpenGraph & Ikon' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setGalleryFilter(tab.id)}
                  className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                    galleryFilter === tab.id
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3D Scene Preview Grid */}
          {(galleryFilter === 'all' || galleryFilter === 'scenes') && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {PREVIEW_GALLERY.map((item) => (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors hover:border-cyan-600/60"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    {!brokenIds[item.id] ? (
                      <img
                        src={item.src}
                        alt={item.alt}
                        referrerPolicy="no-referrer"
                        onError={() => markBroken(item.id)}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-cyan-50 p-6 text-center">
                        <span className="font-display text-base font-semibold text-slate-800">
                          {item.title}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="mb-1.5 text-xs font-medium text-cyan-800">{item.meta}</div>
                    <h3 className="font-display mb-2 text-lg font-bold text-slate-950">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600">{item.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* OpenGraph Social Card & Tab Icon Showcase */}
          {(galleryFilter === 'all' || galleryFilter === 'opengraph') && (
            <div
              className={`${
                galleryFilter === 'all' ? 'mt-8' : ''
              } grid grid-cols-1 gap-6 lg:grid-cols-12`}
            >
              {/* OpenGraph 1200x630 Share Card Preview */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 lg:col-span-8">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <Share2 className="h-3.5 w-3.5 text-cyan-700" />
                    <span>Pratinjau Kartu Berbagi OpenGraph &amp; Twitter</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">1280 × 720 · og:image</span>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="aspect-video w-full overflow-hidden bg-slate-100">
                      {!brokenIds['og'] ? (
                        <img
                          src={ogPreviewImg}
                          alt="OpenGraph Social Preview Nano-Medika: Ekspedisi Mikro 3D"
                          referrerPolicy="no-referrer"
                          onError={() => markBroken('og')}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-cyan-50 text-sm font-semibold text-cyan-900">
                          Nano-Medika OpenGraph Preview
                        </div>
                      )}
                    </div>
                    <div className="border-t border-slate-200 p-4">
                      <div className="font-mono text-[11px] text-slate-500">nano-medika.app</div>
                      <div className="font-display mt-0.5 text-base font-bold text-slate-950">
                        Nano-Medika: Ekspedisi Mikro 3D — Aksi Biologi Ray-Traced
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        Masuki tubuh Raka bersama Profesor Aris dan robot B.I.O.-7 melewati 10 zona organ dari mulut hingga jantung.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Favicon & Tab Icon Card */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-6 lg:col-span-4">
                <div>
                  <div className="mb-1 text-xs font-medium text-cyan-800">Ikon Tab Browser</div>
                  <h3 className="font-display mb-2 text-lg font-bold text-slate-950">
                    Favicon SVG &amp; App Icon
                  </h3>
                  <p className="mb-6 text-xs leading-relaxed text-slate-600">
                    Emblem membran sel, Nano-Pod, dan heliks DNA yang dirancang tetap tajam pada ukuran tab browser 16px hingga layar beranda ponsel.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Mock Browser Tab Preview */}
                  <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5">
                    <img
                      src="/favicon.svg"
                      alt="Ikon Tab Nano-Medika"
                      className="h-5 w-5 shrink-0"
                    />
                    <span className="truncate text-xs font-medium text-slate-800">
                      Nano-Medika: Ekspedisi Mikro 3D
                    </span>
                  </div>

                  {/* Square 1:1 App Emblem */}
                  <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3.5">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                      {!brokenIds['icon'] ? (
                        <img
                          src={tabIconImg}
                          alt="Ikon Aplikasi Nano-Medika"
                          referrerPolicy="no-referrer"
                          onError={() => markBroken('icon')}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img src="/favicon.svg" alt="Ikon Nano-Medika" className="h-full w-full p-2" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900">Ikon &amp; Metadata Lengkap</div>
                      <div className="mt-1 font-mono text-[11px] text-slate-500">
                        favicon.svg · og:image · twitter:card · JSON-LD
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Subtle Biological Membrane Divider */}
      <div aria-hidden="true" className="bg-white">
        <svg viewBox="0 0 1440 48" className="block h-8 w-full text-slate-50 sm:h-12" preserveAspectRatio="none">
          <path
            fill="currentColor"
            d="M0,32 C240,6 480,46 720,24 C960,2 1200,42 1440,18 L1440,48 L0,48 Z"
          />
        </svg>
      </div>

      {/* =========================================================
          SECTION 2: STORY, WEAPONS & CONTROLS
         ========================================================= */}
      <section
        id="story-weapons-section"
        className="relative z-0 border-b border-slate-200 bg-slate-50 py-16 sm:py-24"
      >
        <div className="relative z-20 mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
            {/* Story Prose Column */}
            <div className="lg:col-span-6">
              <p className="mb-2 text-xs font-semibold tracking-wide text-cyan-800">
                Alur Cerita &amp; Misi Biologi
              </p>
              <h2
                className="font-display mb-4 font-bold tracking-tight text-slate-950"
                style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: 1.15, textWrap: 'balance' }}
              >
                Menyusut ke Skala Mikro Demi Kesembuhan Sang Cucu
              </h2>
              <p className="mb-8 text-sm leading-relaxed text-slate-600 sm:text-base">
                Saat antibiotik biasa gagal menghentikan mutasi{' '}
                <span className="font-semibold text-rose-700">Chrono-Virus Omega</span>, Profesor Aris
                mengaktifkan mesin pengecil kuantum di laboratoriumnya. Setelah adegan pembuka sinematik di sisi
                ranjang Raka, Anda akan mengendalikan Nano-Pod memasuki rongga mulut hingga keluar kembali dengan selamat.
              </p>

              {/* Hairline-Separated Feature Points (No Nested Cards) */}
              <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
                <div className="py-4">
                  <h3 className="font-display mb-1 text-sm font-bold text-slate-950">
                    01. Lorong Anatomi Bercabang 3D
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                    Pilih jalur kiri atau kanan mengitari 42 pilar persimpangan multi-jalur dan 71 cabang saluran bronkus, pembuluh portal, serta lipatan usus.
                  </p>
                </div>
                <div className="py-4">
                  <h3 className="font-display mb-1 text-sm font-bold text-slate-950">
                    02. Audio Organ Adaptif &amp; Haptik Mobile
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                    Suara detak jantung, aliran darah, hingga percikan impuls sinapsis berubah otomatis mengikuti zona organ, dilengkapi getaran haptik pada perangkat mobile.
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Special Weapons Stacked Hairline List */}
            <div id="weapons-list" className="lg:col-span-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-slate-950">
                  Persenjataan Khusus Nano-Pod
                </h3>
                <span className="font-mono text-xs text-slate-500">Klik kanan / Tombol 1–3</span>
              </div>

              <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {([1, 2, 3] as WeaponId[]).map((id) => {
                  const w = WEAPONS[id];
                  return (
                    <div key={id} className="flex items-start gap-4 p-5">
                      <div
                        className="font-mono flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm font-bold"
                        style={{
                          borderColor: `${w.color}55`,
                          backgroundColor: `${w.color}14`,
                          color: '#0f172a',
                        }}
                      >
                        {w.key}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-display text-base font-bold text-slate-950">{w.name}</h4>
                          <span className="font-mono text-xs text-slate-500">
                            {w.energyCost === 0 ? 'Energi 0' : `Energi ${w.energyCost}`}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">{w.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Clean 2-Column Desktop & Mobile Controls */}
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6">
              <Gamepad2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" />
              <div>
                <h3 className="font-display mb-1.5 text-base font-bold text-slate-950">
                  Kontrol Desktop (Keyboard &amp; Mouse)
                </h3>
                <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                  WASD / Panah atau Scroll Mouse untuk maju-mundur · Q/E naik turun · Mouse bidik &amp; klik kiri tembak · Klik kanan atau 1–3 ganti senjata · Spasi Boost · F bantuan B.I.O.-7 · R Ray Tracing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6">
              <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" />
              <div>
                <h3 className="font-display mb-1.5 text-base font-bold text-slate-950">
                  Kontrol Mobile (Joystick &amp; Haptik)
                </h3>
                <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                  Joystick analog kiri untuk manuver bebas, sentuh layar untuk membidik, tombol Tembak, Boost &amp; B.I.O.-7 di kanan, serta sakelar getaran Haptic Feedback di HUD.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SECTION 3: 10 ANATOMICAL ZONES & FINAL CTA
         ========================================================= */}
      <section id="zones-section" className="relative z-0 bg-white py-16 sm:py-24">
        <div className="relative z-20 mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mb-10 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-cyan-800">
                Peta Perjalanan Medis
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                10 Zona Organ Tubuh Hingga Gerbang Keluar
              </h2>
            </div>
            <div className="font-mono text-xs text-slate-500">
              0 m Mulut — 6.200 m Gerbang Anus
            </div>
          </div>

          <div className="mb-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {ZONES.map((z) => (
              <div
                key={z.index}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-cyan-600/50"
              >
                <div>
                  <div className="mb-1 text-[11px] font-semibold text-cyan-800">{z.subtitle}</div>
                  <h3 className="font-display mb-2 text-sm font-bold text-slate-950">{z.name}</h3>
                  <p className="text-xs leading-relaxed text-slate-600">{z.objectiveText}</p>
                </div>
                <div className="font-mono mt-4 border-t border-slate-100 pt-2.5 text-[11px] font-medium tabular-nums text-slate-500">
                  Target {Math.abs(z.zEnd).toLocaleString('id-ID')} m
                </div>
              </div>
            ))}
          </div>

          {/* Minimalist Final Conversion Callout */}
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-7 md:flex-row md:items-center sm:p-9">
            <div>
              <h3 className="font-display mb-1.5 text-2xl font-bold text-slate-950">
                Siap Memasuki Tubuh Raka Bersama Profesor Aris?
              </h3>
              <p className="text-sm text-slate-600">
                Putar adegan pembuka di laboratorium dan tuntaskan misi 10 zona organ untuk memulihkan Raka.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onStart(0)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-cyan-700 px-6 py-3.5 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-cyan-800"
            >
              <span>Mulai Ekspedisi</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-8">
          <div className="font-medium text-slate-700">
            Nano-Medika: Ekspedisi Mikro 3D · Simulasi Biologi &amp; Aksi WebGL2
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => scrollToSection('preview-section')}
              className="cursor-pointer transition-colors hover:text-slate-950"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('story-weapons-section')}
              className="cursor-pointer transition-colors hover:text-slate-950"
            >
              Cerita &amp; Senjata
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('zones-section')}
              className="cursor-pointer transition-colors hover:text-slate-950"
            >
              10 Zona Organ
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

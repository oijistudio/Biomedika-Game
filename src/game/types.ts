export type GamePhase =
  | 'title'
  | 'intro'
  | 'playing'
  | 'paused'
  | 'ending'
  | 'victory'
  | 'gameover';

export type WeaponId = 1 | 2 | 3;

export type ZoneIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface WeaponSpec {
  id: WeaponId;
  name: string;
  shortName: string;
  key: string;
  color: string;
  hex: number;
  cooldown: number;
  energyCost: number;
  description: string;
}

export const WEAPONS: Record<WeaponId, WeaponSpec> = {
  1: {
    id: 1,
    name: 'Laser UV-C Pulsa',
    shortName: 'UV-C Laser',
    key: '1',
    color: '#22d3ee',
    hex: 0x22d3ee,
    cooldown: 0.14,
    energyCost: 0,
    description: 'Tembakan foton cepat untuk menghancurkan kapsid virus.',
  },
  2: {
    id: 2,
    name: 'Cryo-Antibodi Burst',
    shortName: 'Cryo-Burst',
    key: '2',
    color: '#60a5fa',
    hex: 0x60a5fa,
    cooldown: 0.42,
    energyCost: 12,
    description: 'Proyektil pembeku menyebar yang memperlambat patogen cepat.',
  },
  3: {
    id: 3,
    name: 'Resonansi Nano Nova',
    shortName: 'Nano-Nova',
    key: '3',
    color: '#34d399',
    hex: 0x34d399,
    cooldown: 1.35,
    energyCost: 35,
    description: 'Gelombang kejut energi pemurni area luas & peluruh perisai boss.',
  },
};

export interface ZoneSpec {
  index: ZoneIndex;
  name: string;
  subtitle: string;
  zStart: number;
  zEnd: number;
  fogColor: number;
  ambientSky: number;
  ambientGround: number;
  viscosity: number;
  currentZ: number;
  objectiveText: string;
  bioTip: string;
}

export const ANUS_EXIT_Z = -6200;

export const ZONES: ZoneSpec[] = [
  {
    index: 0,
    name: 'Zona 1: Rongga Mulut & Faring',
    subtitle: 'Gerbang Masuk Oral',
    zStart: 10,
    zEnd: -140,
    fogColor: 0x2b0a14,
    ambientSky: 0xffb3c6,
    ambientGround: 0x4a1020,
    viscosity: 1.7,
    currentZ: -1.0,
    objectiveText: 'Basmi virus mukosa di antara lengkung gigi & buka katup faring.',
    bioTip: 'B.I.O.-7: "Kita berhasil masuk lewat mulut Raka! Bersihkan virus awal untuk membuka faring."',
  },
  {
    index: 1,
    name: 'Zona 2: Esofagus & Cabang Bronkus',
    subtitle: 'Percabangan Paru-Paru',
    zStart: -140,
    zEnd: -480,
    fogColor: 0x290b16,
    ambientSky: 0xfda4af,
    ambientGround: 0x4c0519,
    viscosity: 1.85,
    currentZ: -2.4,
    objectiveText: 'Susuri percabangan bronkus kiri-kanan & halau patogen pernapasan.',
    bioTip: 'B.I.O.-7: "Hati-hati persimpangan bronkus! Pilih jalur lorong kiri atau kanan di depan."',
  },
  {
    index: 2,
    name: 'Zona 3: Aliran Darah Arteri',
    subtitle: 'Pembuluh Utama & Cabang Kapiler',
    zStart: -480,
    zEnd: -920,
    fogColor: 0x260408,
    ambientSky: 0xff5a6e,
    ambientGround: 0x3b050b,
    viscosity: 2.1,
    currentZ: -4.2,
    objectiveText: 'Arungi arus eritrosit dan bersihkan Spore-Drifter di cabang kapiler.',
    bioTip: 'B.I.O.-7: "Arus eritrosit sangat deras! Hindari benturan dinding arteri & pilar cabang."',
  },
  {
    index: 3,
    name: 'Zona 4: Sistem Saraf Pusat',
    subtitle: 'Labirin Neuron & Cabang Sinapsis',
    zStart: -920,
    zEnd: -1420,
    fogColor: 0x090d28,
    ambientSky: 0x5eead4,
    ambientGround: 0x1e1b4b,
    viscosity: 1.9,
    currentZ: -2.2,
    objectiveText: 'Lindungi jalur akson bercabang dan lumpuhkan Neuro-Parasit Vektor.',
    bioTip: 'B.I.O.-7: "Awas lonjakan bio-listrik sinapsis! Jaga stabilitas kapal di antara cabang saraf."',
  },
  {
    index: 4,
    name: 'Zona 5: Jantung & Katup Koroner',
    subtitle: 'Ruang Miokardium — Inti Penyakit',
    zStart: -1420,
    zEnd: -1780,
    fogColor: 0x1f030c,
    ambientSky: 0xfb7185,
    ambientGround: 0x3b0712,
    viscosity: 2.05,
    currentZ: 0.0,
    objectiveText: 'Hancurkan 3 Nodus Perisai dan musnahkan Chrono-Virus Omega di Jantung!',
    bioTip: 'B.I.O.-7: "Sumber penyakit misterius Raka ada di ruang jantung! Hancurkan 3 nodus kuning dulu!"',
  },
  {
    index: 5,
    name: 'Zona 6: Sirkulasi Hati & Portal',
    subtitle: 'Labirin Sinusoid Hepatika',
    zStart: -1780,
    zEnd: -2420,
    fogColor: 0x241406,
    ambientSky: 0xfbbf24,
    ambientGround: 0x451a03,
    viscosity: 1.75,
    currentZ: -4.6,
    objectiveText: 'Melaju lewat percabangan saluran empedu & bersihkan sisa koloni patogen.',
    bioTip: 'B.I.O.-7: "Kita memasuki jaringan hati! Banyak lorong cabang portal di kiri dan kanan."',
  },
  {
    index: 6,
    name: 'Zona 7: Labirin Ginjal & Nefron',
    subtitle: 'Lengkung Filtrasi & Tubulus',
    zStart: -2420,
    zEnd: -3120,
    fogColor: 0x0f1f1c,
    ambientSky: 0x34d399,
    ambientGround: 0x064e3b,
    viscosity: 1.65,
    currentZ: -5.2,
    objectiveText: 'Navigasi tikungan nefron bercabang sambil menembak spora penyumbat.',
    bioTip: 'B.I.O.-7: "Lengkung nefron menyaring racun tubuh Raka — waspadai sekat pemisah lorong!"',
  },
  {
    index: 7,
    name: 'Zona 8: Usus Halus Berkelok',
    subtitle: 'Lorong Vili & Cabang Mesenterika',
    zStart: -3120,
    zEnd: -4420,
    fogColor: 0x241108,
    ambientSky: 0xfdba74,
    ambientGround: 0x451a03,
    viscosity: 1.5,
    currentZ: -6.2,
    objectiveText: 'Terobos ribuan lipatan vili & cabang usus halus yang sangat panjang!',
    bioTip: 'B.I.O.-7: "Peristalsis mempercepat kapal kita! Manfaatkan Spasi Boost di tikungan panjang."',
  },
  {
    index: 8,
    name: 'Zona 9: Kolon Panjang Endless',
    subtitle: 'Lorong Haustra & Sekum Terakhir',
    zStart: -4420,
    zEnd: -6040,
    fogColor: 0x21100a,
    ambientSky: 0xf59e0b,
    ambientGround: 0x431407,
    viscosity: 1.45,
    currentZ: -7.0,
    objectiveText: 'Bertahan melewati gelombang patogen kolon sepanjang lorong akhir!',
    bioTip: 'B.I.O.-7: "Gerbang keluar sudah semakin dekat, Prof! Terobos barikade terakhir ini!"',
  },
  {
    index: 9,
    name: 'Zona 10: Rektum & Gerbang Anus',
    subtitle: 'Pintu Keluar Menuju Laboratorium',
    zStart: -6040,
    zEnd: -6240,
    fogColor: 0x2d1610,
    ambientSky: 0xfef3c7,
    ambientGround: 0x78350f,
    viscosity: 1.4,
    currentZ: -7.5,
    objectiveText: 'Sfingter Anus terbuka! Terbang keluar menuju cahaya laboratorium!',
    bioTip: 'B.I.O.-7: "Cahaya laboratorium terlihat! Kita segera kembali ke wujud asli!"',
  },
];

export interface MinimapEnemyBlip {
  dx: number;
  dz: number;
  kind: 'rhino' | 'spore' | 'neuro' | 'boss';
  isShieldNode?: boolean;
}

export interface MinimapBranchBlip {
  dx: number;
  dz: number;
  side: -1 | 1;
}

export interface MinimapObstacleBlip {
  dx: number;
  dz: number;
  r: number;
}

export interface MinimapSnapshot {
  playerZ: number;
  lateralX: number; // -1..1 relative to tunnel center
  lateralY: number; // -1..1 relative to tunnel center
  robotDx: number;
  robotDz: number;
  nextOrganLabel: string;
  nextOrganDistance: number;
  nextOrganDx: number;
  nextOrganDz: number;
  tunnelSamples: { dx: number; dz: number; r: number }[];
  enemies: MinimapEnemyBlip[];
  branches: MinimapBranchBlip[];
  obstacles: MinimapObstacleBlip[];
}

export interface TargetLockSnapshot {
  active: boolean;
  screenX: number; // 0..100 %
  screenY: number; // 0..100 %
  name: string;
  hpPct: number;
  dist: number;
  kind: 'rhino' | 'spore' | 'neuro' | 'boss' | 'shield';
}

export interface HudSnapshot {
  phase: GamePhase;
  hull: number;
  maxHull: number;
  energy: number;
  maxEnergy: number;
  patientVitality: number;
  score: number;
  kills: number;
  combo: number;
  activeWeapon: WeaponId;
  zoneIndex: ZoneIndex;
  zoneProgress: number; // 0..1 overall journey
  zoneRemainingEnemies: number;
  distanceMeters: number;
  targetExitMeters: number;
  endlessSector: number;
  bossActive: boolean;
  bossDefeated: boolean;
  bossHp: number;
  bossMaxHp: number;
  bossName: string;
  bioMessage: string;
  bioAssistReady: boolean;
  rayTracingEnabled: boolean;
  isSoftwareGl: boolean;
  muted: boolean;
  hapticsEnabled: boolean;
  hapticsSupported: boolean;
  boostCooldown: number;
  elapsedSeconds: number;
  introStage: number;
  introSubtitle: string;
  endingStage: number;
  endingSubtitle: string;
  endingReadyForSummary: boolean;
  impactEventId: number;
  impactFlashKind: 'none' | 'damage' | 'bossKill' | 'heavyKill';
  screenShakeStrength: number;
  targetLock: TargetLockSnapshot;
  minimap: MinimapSnapshot;
}

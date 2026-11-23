export type GamePhase = 'title' | 'playing' | 'paused' | 'ending' | 'victory' | 'gameover';

export type WeaponId = 1 | 2 | 3;

export type ZoneIndex = 0 | 1 | 2 | 3 | 4 | 5;

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

export const ANUS_EXIT_Z = -2585;

export const ZONES: ZoneSpec[] = [
  {
    index: 0,
    name: 'Zona 1: Rongga Mulut',
    subtitle: 'Gerbang Masuk & Tenggorokan',
    zStart: 10,
    zEnd: -130,
    fogColor: 0x2b0a14,
    ambientSky: 0xffb3c6,
    ambientGround: 0x4a1020,
    viscosity: 1.75,
    currentZ: -0.8,
    objectiveText: 'Basmi virus mukosa di antara lengkung gigi & buka katup faring.',
    bioTip: 'B.I.O.-7: "Profesor, saliva mengandung enzim aktif. Bersihkan virus untuk membuka faring!"',
  },
  {
    index: 1,
    name: 'Zona 2: Aliran Darah Arteri',
    subtitle: 'Trakea & Pembuluh Darah Utama',
    zStart: -130,
    zEnd: -330,
    fogColor: 0x260408,
    ambientSky: 0xff5a6e,
    ambientGround: 0x3b050b,
    viscosity: 2.2,
    currentZ: -3.6,
    objectiveText: 'Arungi arus eritrosit dan bersihkan bakteri penginfeksi darah.',
    bioTip: 'B.I.O.-7: "Arus plasma mendorong kita maju! Waspadai Spore-Drifter di aliran darah."',
  },
  {
    index: 2,
    name: 'Zona 3: Sistem Saraf Pusat',
    subtitle: 'Jaringan Neuron & Sumsum Tulang',
    zStart: -330,
    zEnd: -540,
    fogColor: 0x090d28,
    ambientSky: 0x5eead4,
    ambientGround: 0x1e1b4b,
    viscosity: 1.95,
    currentZ: -1.8,
    objectiveText: 'Lindungi jalur sinapsis dan lumpuhkan Neuro-Parasit Vektor.',
    bioTip: 'B.I.O.-7: "Awas lonjakan bio-listrik! Sinyal saraf Raka pulih saat parasit musnah."',
  },
  {
    index: 3,
    name: 'Zona 4: Jantung & Organ Vital',
    subtitle: 'Ruang Miokardium — Inti Penyakit',
    zStart: -540,
    zEnd: -760,
    fogColor: 0x1f030c,
    ambientSky: 0xfb7185,
    ambientGround: 0x3b0712,
    viscosity: 2.1,
    currentZ: 0.0,
    objectiveText: 'Hancurkan 3 Nodus Perisai dan musnahkan Chrono-Virus Omega di Jantung!',
    bioTip: 'B.I.O.-7: "Ini sumber penyakit misteriusnya, Prof! Hancurkan 3 nodus kuning lalu serang intinya!"',
  },
  {
    index: 4,
    name: 'Zona 5: Lorong Pencernaan Endless',
    subtitle: 'Usus Halus & Kolon Tak Berujung',
    zStart: -760,
    zEnd: -2480,
    fogColor: 0x241108,
    ambientSky: 0xfdba74,
    ambientGround: 0x451a03,
    viscosity: 1.55,
    currentZ: -5.8,
    objectiveText: 'Terus melaju menyusuri lorong tak berujung & basmi gelombang virus hingga pintu keluar!',
    bioTip: 'B.I.O.-7: "Jalur mulut tertutup! Kita harus menembus lorong pencernaan panjang menuju gerbang keluar!"',
  },
  {
    index: 5,
    name: 'Zona 6: Rektum & Gerbang Anus',
    subtitle: 'Pintu Keluar Menuju Laboratorium',
    zStart: -2480,
    zEnd: -2610,
    fogColor: 0x2d1610,
    ambientSky: 0xfef3c7,
    ambientGround: 0x78350f,
    viscosity: 1.4,
    currentZ: -6.5,
    objectiveText: 'Sfingter Anus terbuka! Terbang keluar menuju cahaya laboratorium!',
    bioTip: 'B.I.O.-7: "Cahaya luar terlihat, Prof! Gerbang Anus terbuka — kita segera kembali ke lab!"',
  },
];

export interface MinimapEnemyBlip {
  dx: number;
  dz: number;
  kind: 'rhino' | 'spore' | 'neuro' | 'boss';
  isShieldNode?: boolean;
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
  boostCooldown: number;
  elapsedSeconds: number;
  endingStage: number;
  endingSubtitle: string;
  endingReadyForSummary: boolean;
  targetLock: TargetLockSnapshot;
  minimap: MinimapSnapshot;
}

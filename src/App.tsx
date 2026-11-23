/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { NanoMedikaEngine } from './game/engine';
import { loadProgress, SavedProgress } from './game/storage';
import { ANUS_EXIT_Z, HudSnapshot, WeaponId, ZONES, ZoneIndex } from './game/types';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { GameModals } from './components/GameModals';

const INITIAL_HUD: HudSnapshot = {
  phase: 'title',
  hull: 100,
  maxHull: 100,
  energy: 100,
  maxEnergy: 100,
  patientVitality: 54,
  score: 0,
  kills: 0,
  combo: 0,
  activeWeapon: 1,
  zoneIndex: 0,
  zoneProgress: 0,
  zoneRemainingEnemies: 6,
  distanceMeters: 0,
  targetExitMeters: Math.abs(ANUS_EXIT_Z) + 2,
  endlessSector: 0,
  bossActive: false,
  bossDefeated: false,
  bossHp: 760,
  bossMaxHp: 760,
  bossName: 'CHRONO-VIRUS OMEGA',
  bioMessage: ZONES[0].bioTip,
  bioAssistReady: true,
  rayTracingEnabled: true,
  isSoftwareGl: false,
  muted: false,
  hapticsEnabled: true,
  hapticsSupported: typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function',
  boostCooldown: 0,
  elapsedSeconds: 0,
  introStage: 0,
  introSubtitle: '',
  endingStage: 0,
  endingSubtitle: '',
  endingReadyForSummary: false,
  impactEventId: 0,
  impactFlashKind: 'none',
  screenShakeStrength: 0,
  targetLock: {
    active: false,
    screenX: 50,
    screenY: 50,
    name: '',
    hpPct: 100,
    dist: 0,
    kind: 'rhino',
  },
  minimap: {
    playerZ: 2,
    lateralX: 0,
    lateralY: 0,
    robotDx: 2.4,
    robotDz: 0,
    nextOrganLabel: 'Katup Faring',
    nextOrganDistance: 136,
    nextOrganDx: 0,
    nextOrganDz: -136,
    tunnelSamples: [],
    enemies: [],
    branches: [],
    obstacles: [],
  },
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<NanoMedikaEngine | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [savedProgress, setSavedProgress] = useState<SavedProgress>(() => loadProgress());

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const engine = new NanoMedikaEngine(container, (snapshot) => {
      setHud(snapshot);
      if (
        snapshot.phase === 'ending' ||
        snapshot.phase === 'victory' ||
        snapshot.phase === 'gameover' ||
        snapshot.phase === 'title'
      ) {
        setSavedProgress(loadProgress());
      }
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleStart = (startZone: ZoneIndex = 0) => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    engineRef.current?.startMission(startZone);
  };
  const handleResume = () => engineRef.current?.setPhase('playing');
  const handlePause = () => engineRef.current?.setPhase('paused');
  const handleRestart = () => engineRef.current?.startMission(0);
  const handleSkipIntro = () => engineRef.current?.skipIntro();
  const handleSelectWeapon = (id: WeaponId) => engineRef.current?.selectWeapon(id);
  const handleToggleRayTracing = () => engineRef.current?.toggleRayTracing();
  const handleToggleMute = () => engineRef.current?.toggleMute();
  const handleToggleHaptics = () => engineRef.current?.toggleHaptics();
  const handleOpenVictorySummary = () => engineRef.current?.openVictorySummary();
  const handleMobileInput = (
    moveX: number,
    moveZ: number,
    aimX?: number,
    aimY?: number,
    firing?: boolean
  ) => engineRef.current?.setMobileTouchInput(moveX, moveZ, aimX, aimY, firing);
  const handleMobileBoost = () => engineRef.current?.triggerMobileBoost();
  const handleMobileAssist = () => engineRef.current?.triggerMobileAssist();

  const isScrollableTitle = hud.phase === 'title';

  return (
    <main
      className={`relative bg-[#070c16] ${
        isScrollableTitle
          ? 'min-h-screen w-full overflow-x-hidden'
          : 'h-screen w-screen overflow-hidden touch-none'
      }`}
    >
      {/* Isolated WebGL Canvas Mount */}
      <div
        ref={canvasMountRef}
        className={`fixed inset-0 h-full w-full ${hud.phase === 'playing' ? 'cursor-none' : 'cursor-default'}`}
      />

      {hud.phase === 'title' && (
        <TitleScreen
          onStart={handleStart}
          rayTracingEnabled={hud.rayTracingEnabled}
          onToggleRayTracing={handleToggleRayTracing}
          muted={hud.muted}
          onToggleMute={handleToggleMute}
          savedProgress={savedProgress}
        />
      )}

      {hud.phase === 'playing' && (
        <GameHUD
          hud={hud}
          onSelectWeapon={handleSelectWeapon}
          onToggleRayTracing={handleToggleRayTracing}
          onToggleMute={handleToggleMute}
          onToggleHaptics={handleToggleHaptics}
          onPause={handlePause}
          onMobileInput={handleMobileInput}
          onMobileBoost={handleMobileBoost}
          onMobileAssist={handleMobileAssist}
        />
      )}

      <GameModals
        hud={hud}
        savedProgress={savedProgress}
        onResume={handleResume}
        onRestart={handleRestart}
        onSkipIntro={handleSkipIntro}
        onToggleRayTracing={handleToggleRayTracing}
        onOpenVictorySummary={handleOpenVictorySummary}
      />
    </main>
  );
}

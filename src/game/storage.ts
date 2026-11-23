import { ZoneIndex } from './types';

const STORAGE_KEY = 'nano_medika_progress_v1';

export interface SavedProgress {
  bestScore: number;
  bestTimeSeconds: number | null;
  totalKills: number;
  highestZoneReached: ZoneIndex;
  missionsCompleted: number;
  bestVitality: number;
}

const DEFAULT_PROGRESS: SavedProgress = {
  bestScore: 0,
  bestTimeSeconds: null,
  totalKills: 0,
  highestZoneReached: 0,
  missionsCompleted: 0,
  bestVitality: 58,
};

export function loadProgress(): SavedProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    return {
      bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : 0,
      bestTimeSeconds: typeof parsed.bestTimeSeconds === 'number' ? parsed.bestTimeSeconds : null,
      totalKills: typeof parsed.totalKills === 'number' ? parsed.totalKills : 0,
      highestZoneReached:
        typeof parsed.highestZoneReached === 'number' &&
        parsed.highestZoneReached >= 0 &&
        parsed.highestZoneReached <= 9
          ? (parsed.highestZoneReached as ZoneIndex)
          : 0,
      missionsCompleted: typeof parsed.missionsCompleted === 'number' ? parsed.missionsCompleted : 0,
      bestVitality: typeof parsed.bestVitality === 'number' ? parsed.bestVitality : 58,
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveRunProgress(update: {
  score: number;
  killsDelta: number;
  zoneReached: ZoneIndex;
  vitality: number;
  victory?: boolean;
  elapsedSeconds?: number;
}): SavedProgress {
  const current = loadProgress();
  const next: SavedProgress = {
    bestScore: Math.max(current.bestScore, update.score),
    totalKills: current.totalKills + Math.max(0, update.killsDelta),
    highestZoneReached: Math.max(current.highestZoneReached, update.zoneReached) as ZoneIndex,
    missionsCompleted: current.missionsCompleted + (update.victory ? 1 : 0),
    bestVitality: Math.max(current.bestVitality, update.vitality),
    bestTimeSeconds:
      update.victory && typeof update.elapsedSeconds === 'number'
        ? current.bestTimeSeconds === null
          ? update.elapsedSeconds
          : Math.min(current.bestTimeSeconds, update.elapsedSeconds)
        : current.bestTimeSeconds,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota/storage restrictions
  }
  return next;
}

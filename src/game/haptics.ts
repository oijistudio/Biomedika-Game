import { WeaponId } from './types';

export class BioHapticsEngine {
  private supported: boolean;
  private enabled = true;
  private lastFireMs = 0;
  private lastHitMs = 0;
  private lastBumpMs = 0;
  private lastLockMs = 0;

  constructor() {
    this.supported =
      typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  }

  public isSupported(): boolean {
    return this.supported;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.supported) {
      try {
        navigator.vibrate(0);
      } catch {
        // Ignore browser restrictions
      }
    }
  }

  private vibrate(pattern: number | number[]): void {
    if (!this.enabled || !this.supported) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore if device blocks vibration prior to user gesture
    }
  }

  public pulseWeapon(weapon: WeaponId): void {
    const now = performance.now();
    if (weapon === 1) {
      if (now - this.lastFireMs < 110) return;
      this.lastFireMs = now;
      this.vibrate(12);
    } else if (weapon === 2) {
      if (now - this.lastFireMs < 180) return;
      this.lastFireMs = now;
      this.vibrate([18, 22, 18]);
    } else {
      this.lastFireMs = now;
      this.vibrate([45, 25, 65]);
    }
  }

  public pulseBoost(): void {
    this.vibrate([22, 18, 36]);
  }

  public pulseEnemyKill(isBoss = false): void {
    if (isBoss) {
      this.vibrate([80, 40, 120, 40, 160]);
    } else {
      this.vibrate([20, 16, 28]);
    }
  }

  public pulseDamageTaken(): void {
    const now = performance.now();
    if (now - this.lastHitMs < 220) return;
    this.lastHitMs = now;
    this.vibrate([70, 35, 90]);
  }

  public pulseWallImpact(impactSpeed: number): void {
    const now = performance.now();
    if (now - this.lastBumpMs < 180) return;
    this.lastBumpMs = now;
    const ms = Math.min(60, Math.max(20, Math.round(18 + impactSpeed * 2.5)));
    this.vibrate(ms);
  }

  public pulseObstacleHit(): void {
    const now = performance.now();
    if (now - this.lastBumpMs < 180) return;
    this.lastBumpMs = now;
    this.vibrate([48, 24, 38]);
  }

  public pulseCellBump(): void {
    const now = performance.now();
    if (now - this.lastBumpMs < 180) return;
    this.lastBumpMs = now;
    this.vibrate(14);
  }

  public pulseGateOpen(): void {
    this.vibrate([25, 30, 45]);
  }

  public pulsePickup(): void {
    this.vibrate(24);
  }

  public pulseLockOn(): void {
    const now = performance.now();
    if (now - this.lastLockMs < 240) return;
    this.lastLockMs = now;
    this.vibrate(10);
  }
}

import { ZoneIndex } from './types';

export class BioAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private ambientNoiseSource: AudioBufferSourceNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private ambientNoiseGain: GainNode | null = null;

  private muted = false;
  private initialized = false;
  private neuralSparkTimer = 0;
  private visceralGurgleTimer = 1.2;
  private enemyFireSfxCooldown = 0;
  private currentZone: ZoneIndex = 0;

  // Procedural Action & Ending Music Sequencer state
  private musicStepTimer = 0;
  private musicStep = 0;
  private noiseBurstBuffer: AudioBuffer | null = null;

  public init(): void {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.44;
      this.masterGain.connect(this.ctx.destination);

      // 1. Submersible Engine & Deep Visceral Organ Resonance Drone
      this.droneOsc = this.ctx.createOscillator();
      this.droneGain = this.ctx.createGain();
      const droneFilter = this.ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.value = 145;

      this.droneOsc.type = 'triangle';
      this.droneOsc.frequency.value = 52;
      this.droneGain.gain.value = 0.03;

      this.droneOsc.connect(droneFilter);
      droneFilter.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);
      this.droneOsc.start();

      // 2. Context-Aware Biological Fluid / Stomach / Neural / Peristaltic Ambient Noise Layer
      const sampleRate = this.ctx.sampleRate;
      const noiseBuf = this.ctx.createBuffer(1, sampleRate * 2, sampleRate);
      const data = noiseBuf.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.055 * white) / 1.055;
        lastOut = data[i];
        data[i] *= 3.0;
      }

      // Crisp short white noise buffer for percussion hi-hat / snare
      const drumBuf = this.ctx.createBuffer(1, Math.floor(sampleRate * 0.12), sampleRate);
      const drumData = drumBuf.getChannelData(0);
      for (let i = 0; i < drumData.length; i++) {
        drumData[i] = Math.random() * 2 - 1;
      }
      this.noiseBurstBuffer = drumBuf;

      this.ambientNoiseSource = this.ctx.createBufferSource();
      this.ambientNoiseSource.buffer = noiseBuf;
      this.ambientNoiseSource.loop = true;

      this.ambientFilter = this.ctx.createBiquadFilter();
      this.ambientFilter.type = 'bandpass';
      this.ambientFilter.frequency.value = 280;
      this.ambientFilter.Q.value = 1.6;

      this.ambientNoiseGain = this.ctx.createGain();
      this.ambientNoiseGain.gain.value = 0.0;

      this.ambientNoiseSource.connect(this.ambientFilter);
      this.ambientFilter.connect(this.ambientNoiseGain);
      this.ambientNoiseGain.connect(this.masterGain);
      this.ambientNoiseSource.start();

      this.initialized = true;
    } catch {
      // Audio blocked or unsupported
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.44, this.ctx.currentTime, 0.04);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setCombatActive(active: boolean): void {
    if (!this.ctx || !this.ambientNoiseGain || !this.droneGain) return;
    const now = this.ctx.currentTime;
    if (!active) {
      this.ambientNoiseGain.gain.setTargetAtTime(0, now, 0.15);
      this.droneGain.gain.setTargetAtTime(0.012, now, 0.15);
    }
  }

  public setThrustIntensity(intensity: number): void {
    if (!this.ctx || !this.droneOsc || !this.droneGain || this.muted) return;
    const now = this.ctx.currentTime;
    const baseFreq = this.currentZone === 3 ? 44 : this.currentZone === 4 ? 46 : 52;
    this.droneOsc.frequency.setTargetAtTime(baseFreq + intensity * 40, now, 0.08);
    this.droneGain.gain.setTargetAtTime(0.028 + intensity * 0.05, now, 0.08);
  }

  // Context-Aware Biological Soundscape per Organ Zone (including deep stomach/gut gurgles)
  public updateOrganAmbience(
    zoneIndex: ZoneIndex,
    speedRatio: number,
    dt: number,
    heartBeatWave: number
  ): void {
    this.currentZone = zoneIndex;
    this.enemyFireSfxCooldown = Math.max(0, this.enemyFireSfxCooldown - dt);

    if (!this.ctx || !this.ambientFilter || !this.ambientNoiseGain || this.muted) return;
    const now = this.ctx.currentTime;

    if (zoneIndex === 0) {
      // Zona 1: Rongga Mulut — warm humid airflow & salivary movement
      this.ambientFilter.type = 'lowpass';
      this.ambientFilter.frequency.setTargetAtTime(320 + speedRatio * 180, now, 0.18);
      this.ambientFilter.Q.setTargetAtTime(1.4, now, 0.18);
      this.ambientNoiseGain.gain.setTargetAtTime(0.055 + speedRatio * 0.045, now, 0.18);
    } else if (zoneIndex === 1) {
      // Zona 2: Aliran Darah Arteri — pulsing blood flow whooshing!
      const pulseSweep = 250 + speedRatio * 240 + heartBeatWave * 210;
      this.ambientFilter.type = 'bandpass';
      this.ambientFilter.frequency.setTargetAtTime(pulseSweep, now, 0.09);
      this.ambientFilter.Q.setTargetAtTime(2.3, now, 0.12);
      this.ambientNoiseGain.gain.setTargetAtTime(
        0.1 + speedRatio * 0.07 + heartBeatWave * 0.055,
        now,
        0.09
      );
    } else if (zoneIndex === 2) {
      // Zona 3: Sistem Saraf Pusat — crisp neural hum + random synaptic firing sparks!
      this.ambientFilter.type = 'bandpass';
      this.ambientFilter.frequency.setTargetAtTime(880 + speedRatio * 340, now, 0.15);
      this.ambientFilter.Q.setTargetAtTime(3.4, now, 0.15);
      this.ambientNoiseGain.gain.setTargetAtTime(0.05 + speedRatio * 0.035, now, 0.15);

      this.neuralSparkTimer -= dt;
      if (this.neuralSparkTimer <= 0) {
        this.neuralSparkTimer = 0.35 + Math.random() * 0.65;
        this.playNeuralSpark();
      }
    } else if (zoneIndex === 3) {
      // Zona 4: Ruang Jantung — deep cardiac vascular rush synced to systole
      this.ambientFilter.type = 'lowpass';
      this.ambientFilter.frequency.setTargetAtTime(185 + heartBeatWave * 220, now, 0.08);
      this.ambientFilter.Q.setTargetAtTime(2.8, now, 0.1);
      this.ambientNoiseGain.gain.setTargetAtTime(0.085 + heartBeatWave * 0.095, now, 0.08);
    } else if (zoneIndex === 4) {
      // Zona 5: Lorong Pencernaan / Perut Endless — warm churning peristalsis & visceral whoosh
      const churn = 160 + speedRatio * 260 + Math.sin(now * 2.2) * 55;
      this.ambientFilter.type = 'lowpass';
      this.ambientFilter.frequency.setTargetAtTime(churn, now, 0.14);
      this.ambientFilter.Q.setTargetAtTime(2.6, now, 0.14);
      this.ambientNoiseGain.gain.setTargetAtTime(0.11 + speedRatio * 0.08, now, 0.14);
    } else {
      // Zona 6: Gerbang Keluar Anus — bright airy daylight portal rush
      this.ambientFilter.type = 'bandpass';
      this.ambientFilter.frequency.setTargetAtTime(620 + speedRatio * 360, now, 0.12);
      this.ambientFilter.Q.setTargetAtTime(2.0, now, 0.12);
      this.ambientNoiseGain.gain.setTargetAtTime(0.11 + speedRatio * 0.06, now, 0.12);
    }

    // Periodic deep stomach / visceral body fluid gurgles inside the body
    this.visceralGurgleTimer -= dt;
    if (this.visceralGurgleTimer <= 0) {
      this.visceralGurgleTimer = zoneIndex === 4 ? 1.1 + Math.random() * 1.4 : 2.1 + Math.random() * 2.4;
      this.playVisceralGurgle(zoneIndex);
    }
  }

  // Deep organic stomach / body fluid bubble & peristaltic resonance
  private playVisceralGurgle(zoneIndex: ZoneIndex): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const bubbleCount = zoneIndex === 4 ? 3 : 2;
    for (let i = 0; i < bubbleCount; i++) {
      const start = now + i * (0.09 + Math.random() * 0.08);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const bp = this.ctx.createBiquadFilter();
      const fBase = zoneIndex === 4 ? 95 + Math.random() * 85 : 120 + Math.random() * 100;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(fBase, start);
      osc.frequency.exponentialRampToValueAtTime(fBase * (1.45 + Math.random() * 0.5), start + 0.11);
      osc.frequency.exponentialRampToValueAtTime(fBase * 0.72, start + 0.24);

      bp.type = 'bandpass';
      bp.frequency.value = fBase * 1.3;
      bp.Q.value = 3.2;

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(zoneIndex === 4 ? 0.085 : 0.055, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.26);

      osc.connect(bp);
      bp.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.28);
    }
  }

  // Procedural Adaptive Action Music & Warm Laboratory Ending Music
  public updateMusic(dt: number, mode: 'playing' | 'ending' | 'idle', zoneIndex: ZoneIndex): void {
    if (!this.ctx || !this.masterGain || this.muted || mode === 'idle') return;
    const stepDur = mode === 'ending' ? 0.28 : zoneIndex === 3 ? 0.115 : 0.125; // ~120-130 BPM 16ths
    this.musicStepTimer += dt;
    if (this.musicStepTimer < stepDur) return;
    this.musicStepTimer -= stepDur;

    const now = this.ctx.currentTime;
    const step = this.musicStep % 16;
    this.musicStep++;

    if (mode === 'ending') {
      // Warm hopeful Major 7th / 9th synth bell & pad arpeggio for cured Raka in Lab
      const endingNotes = [261.63, 329.63, 392.0, 493.88, 523.25, 493.88, 392.0, 329.63];
      if (step % 2 === 0) {
        const freq = endingNotes[(step / 2) % endingNotes.length];
        this.playMusicTone(freq, 'sine', 0.055, 0.42, now);
      }
      if (step === 0 || step === 8) {
        this.playMusicTone(step === 0 ? 130.81 : 196.0, 'triangle', 0.05, 0.85, now);
      }
      return;
    }

    // Active Combat / Exploration Action Synth Groove inside the Body
    // Bass root frequency shifts by organ zone for musical progression
    const zoneRoots = [73.42, 82.41, 92.5, 65.41, 87.31, 98.0]; // D2, E2, F#2, C2, F2, G2
    const root = zoneRoots[zoneIndex] || 73.42;

    // 1. Driving Synth Kick on quarters (0, 4, 8, 12)
    if (step % 4 === 0) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(118, now);
      kickOsc.frequency.exponentialRampToValueAtTime(36, now + 0.11);
      kickGain.gain.setValueAtTime(0.11, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      kickOsc.connect(kickGain);
      kickGain.connect(this.masterGain);
      kickOsc.start(now);
      kickOsc.stop(now + 0.13);
    }

    // 2. Crisp Hi-Hat / Snare tick
    if (this.noiseBurstBuffer && (step % 2 === 1 || step === 4 || step === 12)) {
      const isSnare = step === 4 || step === 12;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBurstBuffer;
      const hp = this.ctx.createBiquadFilter();
      hp.type = isSnare ? 'bandpass' : 'highpass';
      hp.frequency.value = isSnare ? 1600 : 5200;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(isSnare ? 0.045 : 0.022, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + (isSnare ? 0.09 : 0.035));
      src.connect(hp);
      hp.connect(g);
      g.connect(this.masterGain);
      src.start(now);
      src.stop(now + 0.1);
    }

    // 3. Pulsing Sci-Fi Bassline (offbeats & driving 8ths)
    const bassPattern = [1, 0, 1, 1.5, 1, 0, 1.333, 1, 1, 0, 1, 1.5, 1.189, 0, 1.333, 1.5];
    const bassMult = bassPattern[step];
    if (bassMult > 0) {
      this.playMusicTone(root * bassMult, 'sawtooth', 0.048, 0.11, now, 340);
    }

    // 4. Bio-Action Synth Arpeggio Melody
    const arpScale = [2, 2.378, 3, 3.56, 4, 3.56, 3, 2.378]; // Minor pentatonic / sci-fi arpeggio
    if (step % 2 === 0 || zoneIndex >= 3) {
      const noteFreq = root * arpScale[(this.musicStep + zoneIndex) % arpScale.length];
      this.playMusicTone(noteFreq, 'triangle', 0.032, 0.14, now, 1800);
    }
  }

  private playMusicTone(
    freq: number,
    type: OscillatorType,
    vol: number,
    dur: number,
    when: number,
    lowpassHz = 2400
  ): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(lowpassHz, when);

    gain.gain.setValueAtTime(vol, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  public playNeuralSpark(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const fStart = 1750 + Math.random() * 1900;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(fStart, now);
    osc.frequency.exponentialRampToValueAtTime(fStart * 0.38, now + 0.065);

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1200;

    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(hp);
    hp.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  public playLaser(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const pitchVar = 0.94 + Math.random() * 0.12;

    // Layer 1: Punchy photon laser sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1180 * pitchVar, now);
    osc.frequency.exponentialRampToValueAtTime(185 * pitchVar, now + 0.12);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1550, now);
    filter.Q.value = 2.4;

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.14);

    // Layer 2: Crisp high-tech transient click
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(2200 * pitchVar, now);
    clickOsc.frequency.exponentialRampToValueAtTime(520, now + 0.035);
    clickGain.gain.setValueAtTime(0.075, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.045);
  }

  public playCryoBurst(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const freqs = [1320, 1760, 2340];
    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.018);
      osc.frequency.exponentialRampToValueAtTime(f * 0.42, now + 0.24);

      gain.gain.setValueAtTime(0.11, now + idx * 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.018);
      osc.stop(now + 0.27);
    });
  }

  public playBoost(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.14);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.34);

    sub.type = 'sine';
    sub.frequency.setValueAtTime(95, now);
    sub.frequency.exponentialRampToValueAtTime(42, now + 0.34);

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(450, now);
    bp.frequency.exponentialRampToValueAtTime(1400, now + 0.16);
    bp.Q.value = 1.4;

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    osc.connect(bp);
    bp.connect(gain);
    sub.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    sub.start(now);
    osc.stop(now + 0.37);
    sub.stop(now + 0.37);
  }

  public playNanoNova(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const harm = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(960, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.58);

    harm.type = 'sawtooth';
    harm.frequency.setValueAtTime(480, now);
    harm.frequency.exponentialRampToValueAtTime(140, now + 0.45);

    sub.type = 'triangle';
    sub.frequency.setValueAtTime(120, now);
    sub.frequency.exponentialRampToValueAtTime(32, now + 0.58);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    harm.connect(gain);
    sub.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    harm.start(now);
    sub.start(now);
    osc.stop(now + 0.62);
    harm.stop(now + 0.48);
    sub.stop(now + 0.62);
  }

  public playEnemyFire(kind: 'rhino' | 'spore' | 'neuro' | 'boss'): void {
    if (!this.ctx || !this.masterGain || this.muted || this.enemyFireSfxCooldown > 0) return;
    this.enemyFireSfxCooldown = 0.14;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (kind === 'boss') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(64, now + 0.34);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.37);
    } else if (kind === 'neuro') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(1650, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.11);
      gain.gain.setValueAtTime(0.075, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.13);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(kind === 'spore' ? 540 : 410, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.14);
    }
  }

  public playHit(heavy = false): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = heavy ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(heavy ? 195 : 350, now);
    osc.frequency.exponentialRampToValueAtTime(heavy ? 42 : 95, now + (heavy ? 0.24 : 0.09));

    gain.gain.setValueAtTime(heavy ? 0.26 : 0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.26 : 0.1));

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.27);
  }

  public playVirusPop(kind: 'rhino' | 'spore' | 'neuro' | 'boss' = 'rhino'): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (kind === 'boss') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(34, now + 0.65);
      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.7);
      return;
    }

    osc.type = kind === 'neuro' ? 'square' : 'sine';
    const base = kind === 'neuro' ? 420 : kind === 'spore' ? 320 : 280;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 2.2, now + 0.065);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.18);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playBounce(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(62, now + 0.14);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playLockOn(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1480, now);
    osc.frequency.setValueAtTime(1920, now + 0.025);
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  public playGateOpen(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.14, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.34);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.35);
    });
  }

  public playPickup(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      gain.gain.setValueAtTime(0.13, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.19);
    });
  }

  public playBioChirp(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1174, now + 0.06);
    osc.frequency.setValueAtTime(987, now + 0.12);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  public playHeartbeat(intensity = 1.0): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const volBoost = Math.min(1.4, Math.max(0.45, intensity));
    [0, 0.22].forEach((offset, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(i === 0 ? 68 : 54, now + offset);
      osc.frequency.exponentialRampToValueAtTime(26, now + offset + 0.17);
      gain.gain.setValueAtTime((i === 0 ? 0.24 : 0.16) * volBoost, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.19);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.2);
    });
  }

  public playKonamiChime(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.065);
      gain.gain.setValueAtTime(0.15, now + i * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.065 + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.065);
      osc.stop(now + i * 0.065 + 0.36);
    });
  }

  public playVictory(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.11);
      gain.gain.setValueAtTime(0.18, now + i * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.7);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.11);
      osc.stop(now + i * 0.11 + 0.72);
    });
  }

  public dispose(): void {
    if (this.ambientNoiseSource) {
      try {
        this.ambientNoiseSource.stop();
      } catch {
        // ignore
      }
    }
    if (this.droneOsc) {
      try {
        this.droneOsc.stop();
      } catch {
        // ignore
      }
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
    }
    this.initialized = false;
  }
}
